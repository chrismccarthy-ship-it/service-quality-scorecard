import { LightningElement, api, track, wire } from 'lwc';
import { getRecord, getFieldValue, notifyRecordUpdateAvailable } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import runAnalysis from '@salesforce/apex/ServiceQualityAnalysisController.runAnalysis';

const FIELDS = ['VoiceCall.Service_Quality_Analysis__c', 'MessagingSession.Service_Quality_Analysis__c'];

export default class ServiceQualityScorecard extends LightningElement {
    @api recordId;
    @api objectApiName;

    @track data = null;
    @track isLoading = false;
    @track isRunning = false;
    @track errorMessage = null;

    @wire(getRecord, { recordId: '$recordId', optionalFields: FIELDS })
    wiredRecord({ data, error }) {
        if (data) {
            const jsonValue =
                getFieldValue(data, 'VoiceCall.Service_Quality_Analysis__c') ||
                getFieldValue(data, 'MessagingSession.Service_Quality_Analysis__c');
            if (jsonValue) {
                this.parseAnalysis(jsonValue);
            } else {
                this.data = null;
                this.isLoading = false;
                this.errorMessage = null;
            }
        } else if (error) {
            this.errorMessage = 'Failed to load record data.';
        }
    }

    get hasData() {
        return this.data !== null && !this.isLoading && !this.errorMessage;
    }

    get showNoData() {
        return !this.data && !this.isLoading;
    }

    get hasConcerns() {
        return this.data &&
            this.data.CustomerConcernsRaised &&
            this.data.CustomerConcernsRaised.length > 0;
    }

    get hasKeyMoments() {
        return this.data &&
            this.data.KeyMoments &&
            this.data.KeyMoments.length > 0;
    }

    get totalScore() {
        if (!this.data || !this.data.RepEffectivenessScore) return 0;
        return this.data.RepEffectivenessScore.score;
    }

    get scoreJustification() {
        if (!this.data || !this.data.RepEffectivenessScore) return '';
        return this.data.RepEffectivenessScore.justification;
    }

    get scoreRingClass() {
        const s = this.totalScore;
        if (s >= 80) return 'score-ring score-high';
        if (s >= 50) return 'score-ring score-mid';
        return 'score-ring score-low';
    }

    get sentimentBadgeClass() {
        if (!this.data) return 'badge';
        const s = this.data.CustomerSentiment;
        if (s === 'Positive') return 'badge badge-positive';
        if (s === 'Negative') return 'badge badge-negative';
        return 'badge badge-neutral';
    }

    get outcomeBadgeClass() {
        if (!this.data) return 'badge';
        const o = this.data.CallOutcome;
        if (o === 'Issue Resolved') return 'badge badge-positive';
        if (o === 'Customer Unresolved') return 'badge badge-negative';
        return 'badge badge-neutral';
    }

    get scoreBreakdownItems() {
        if (!this.data || !this.data.ServiceQualityAlignment) return [];

        const alignment = this.data.ServiceQualityAlignment;
        const labels = {
            BuildRapport: 'Build Rapport',
            ActiveListeningAndNeedsIdentification: 'Active Listening & Needs ID',
            ExplainProcess: 'Explain Process',
            DemonstrateKnowledge: 'Product/Service Knowledge',
            HandleConcernsAndDeescalation: 'Handle Concerns & De-escalation',
            ResolutionAndProblemSolving: 'Resolution & Problem Solving',
            ConfirmNextSteps: 'Confirm Next Steps'
        };

        return Object.keys(labels).map(key => {
            const item = alignment[key] || {};
            const maxPoints = item.maxPoints || 0;
            const points = item.pointsAwarded || 0;
            const pct = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
            let barColor = 'bar-fill bar-high';
            if (pct < 75) barColor = 'bar-fill bar-mid';
            if (pct < 25) barColor = 'bar-fill bar-low';

            return {
                key,
                label: labels[key],
                points,
                maxPoints,
                evidence: item.evidence || '',
                barClass: barColor,
                barStyle: `width: ${pct}%`
            };
        });
    }

    get softSkillItems() {
        if (!this.data || !this.data.SoftSkillsAssessment) return [];

        const map = {
            Empathy: { icon: 'utility:heart', label: 'Empathy' },
            Professionalism: { icon: 'utility:ribbon', label: 'Professionalism' },
            Clarity: { icon: 'utility:light_bulb', label: 'Clarity' },
            Patience: { icon: 'utility:clock', label: 'Patience' }
        };

        const assess = this.data.SoftSkillsAssessment;
        return Object.keys(map).map(key => {
            const rating = assess[key] || 'N/A';
            let ratingClass = 'rating rating-strong';
            let iconClass = 'skill-icon skill-icon-strong';
            if (rating === 'Adequate') {
                ratingClass = 'rating rating-adequate';
                iconClass = 'skill-icon skill-icon-adequate';
            }
            if (rating === 'Lacking') {
                ratingClass = 'rating rating-lacking';
                iconClass = 'skill-icon skill-icon-lacking';
            }
            return {
                key,
                label: map[key].label,
                icon: map[key].icon,
                rating,
                ratingClass,
                iconClass
            };
        });
    }

    get topicItems() {
        if (!this.data || !this.data.TopicsDiscussed) return [];
        return this.data.TopicsDiscussed.map((t, i) => ({
            value: t,
            key: 'topic-' + i
        }));
    }

    parseAnalysis(jsonString) {
        this.isLoading = true;
        this.errorMessage = null;

        try {
            let parsed;
            if (typeof jsonString === 'string') {
                const cleaned = jsonString
                    .replace(/```json\s*/gi, '')
                    .replace(/```\s*/gi, '')
                    .trim();
                parsed = JSON.parse(cleaned);
            } else {
                parsed = jsonString;
            }

            if (parsed.CustomerConcernsRaised) {
                parsed.CustomerConcernsRaised = parsed.CustomerConcernsRaised.map(c => ({
                    ...c,
                    statusIcon: c.addressedEffectively
                        ? 'utility:check' : 'utility:close',
                    statusLabel: c.addressedEffectively
                        ? 'Addressed' : 'Not Addressed',
                    statusClass: c.addressedEffectively
                        ? 'concern-status concern-addressed'
                        : 'concern-status concern-not-addressed'
                }));
            }

            this.data = parsed;
        } catch (e) {
            this.errorMessage = 'Failed to parse analysis data: ' + e.message;
            this.data = null;
        } finally {
            this.isLoading = false;
        }
    }

    get runButtonLabel() {
        return this.isRunning ? 'Analyzing...' : 'Run Analysis';
    }

    async handleRunAnalysis() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.errorMessage = null;
        try {
            const result = await runAnalysis({ recordId: this.recordId });
            this.parseAnalysis(result);
            await notifyRecordUpdateAvailable([{ recordId: this.recordId }]);
            this.dispatchEvent(new ShowToastEvent({
                title: 'Analysis complete',
                message: 'Service quality scorecard generated.',
                variant: 'success'
            }));
        } catch (e) {
            const message = (e && e.body && e.body.message) || (e && e.message) || 'Unknown error';
            this.errorMessage = 'Analysis failed: ' + message;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Analysis failed',
                message,
                variant: 'error',
                mode: 'sticky'
            }));
        } finally {
            this.isRunning = false;
        }
    }
}

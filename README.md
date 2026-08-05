# Service Quality Scorecard

AI-powered service quality analysis for Salesforce Service Cloud. Automatically analyzes voice call and messaging session transcripts the moment an interaction ends, evaluating agent performance against seven weighted service standards and rendering a visual scorecard on the record page.

## What It Does

- **Automatic analysis** — Einstein evaluates every transcript against 7 weighted service quality standards the moment a call completes or a messaging session ends
- **Visual scorecard** — Modern LWC renders score breakdown, soft skills assessment, customer concerns, key moments, and coaching insights directly on the record page
- **Real-time notifications** — Custom notifications alert stakeholders when scores are generated
- **Dual channel support** — Works on both Voice Call and Messaging Session records

## Scoring Standards (100 points total)

| Standard | Points | Weight | What It Measures |
|----------|--------|--------|-----------------|
| Build Rapport | 10 | 10% | Trust, empathy, friendly professional tone |
| Active Listening & Needs ID | 20 | 20% | Clarifying questions, confirming understanding |
| Explain Process | 10 | 10% | Steps, timelines, keeping customer informed |
| Product/Service Knowledge | 15 | 15% | Accuracy, confidence, guiding through options |
| Handle Concerns & De-escalation | 15 | 15% | Patience, professionalism with frustrations |
| Resolution & Problem Solving | 20 | 20% | Clear resolution, workaround, or escalation |
| Confirm Next Steps | 10 | 10% | What was resolved, what happens next |

## Package Contents

| Component | Type | Description |
|-----------|------|-------------|
| `serviceQualityScorecard` | LWC | Visual scorecard for Voice Call and Messaging Session record pages |
| `ServiceQualityScoreParser` | Apex Class | Invocable action that extracts the numeric score from JSON for Flow use |
| `Service_Quality_Analysis__c` | Custom Field (VoiceCall) | Long Text Area storing the Einstein JSON output |
| `Service_Quality_Analysis__c` | Custom Field (MessagingSession) | Long Text Area storing the Einstein JSON output |
| `Service_Quality_Scorecard` | Permission Set | Grants field access and Apex class access |

## Deployment

```bash
# Clone the repo
git clone https://github.com/chrismccarthy-ship-it/service-quality-scorecard.git
cd service-quality-scorecard

# Authorize your org
sf org login web --set-default

# Deploy
sf project deploy start --source-dir force-app --ignore-conflicts

# Assign permission set
sf org assign permset --name Service_Quality_Scorecard
```

## Post-Deploy Setup

1. **Assign the permission set** to all relevant users
2. **Create the Einstein Prompt Template** in Prompt Builder (see setup guide)
3. **Create the Custom Notification Type** — Service Quality Alert (Desktop + Mobile)
4. **Build two Record-Triggered Flows:**
   - Voice Call flow (triggers on Status = Completed)
   - Messaging Session flow (triggers on Status = Ended)
5. **Add the LWC** to Voice Call and Messaging Session record pages via App Builder

## Architecture

```
VoiceCall / MessagingSession
        |
        v  (Status changes)
Record-Triggered Flow
        |-- Invoke Einstein Prompt (analyzes transcript)
        |-- Save JSON to Service_Quality_Analysis__c
        |-- Parse Score (Apex)
        |-- Decision: Score > 0?
        |-- Send Custom Notification
        |
        v
LWC reads field via wire adapter → renders scorecard
```

## Related Package

The **QA Validation Dashboard** (`qa-validation-dashboard` repo) extends this solution with:
- Human QA grader scoring alongside AI scores
- AI-Human agreement rate tracking
- Agent performance leaderboard
- Coaching opportunity identification
- AI calibration bias detection

Install this scorecard package first — the validation dashboard depends on it.

## License

MIT

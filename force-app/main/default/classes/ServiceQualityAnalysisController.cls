public with sharing class ServiceQualityAnalysisController {

    private static final String TEMPLATE = 'Call_Quality_Dashboard';

    @TestVisible
    private static String mockResponse;

    /**
     * Runs the Call_Quality_Dashboard prompt template for a VoiceCall or
     * MessagingSession and saves the JSON to Service_Quality_Analysis__c.
     */
    @AuraEnabled
    public static String runAnalysis(Id recordId) {
        String objectName = recordId.getSobjectType().getDescribe().getName();
        String inputKey;
        if (objectName == 'VoiceCall') {
            inputKey = 'Input:Voice_Call';
        } else if (objectName == 'MessagingSession') {
            inputKey = 'Input:Messaging_Session';
        } else {
            throw new AuraHandledException('Service quality analysis supports Voice Call and Messaging Session records only.');
        }

        String text = mockResponse;
        if (text == null) {
            try {
                ConnectApi.EinsteinPromptTemplateGenerationsInput input =
                    new ConnectApi.EinsteinPromptTemplateGenerationsInput();
                input.isPreview = false;
                input.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
                input.additionalConfig.applicationName = 'PromptBuilderPreview';

                ConnectApi.WrappedValue wrapped = new ConnectApi.WrappedValue();
                wrapped.value = new Map<String, String>{ 'id' => String.valueOf(recordId) };
                input.inputParams = new Map<String, ConnectApi.WrappedValue>{ inputKey => wrapped };

                ConnectApi.EinsteinPromptTemplateGenerationsRepresentation result =
                    ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(TEMPLATE, input);
                if (result.generations == null || result.generations.isEmpty()) {
                    throw new AuraHandledException('The prompt template returned no response.');
                }
                text = result.generations[0].text;
            } catch (AuraHandledException e) {
                throw e;
            } catch (Exception e) {
                throw new AuraHandledException('Analysis failed: ' + e.getMessage());
            }
        }

        if (String.isBlank(text)) {
            throw new AuraHandledException('The prompt template returned an empty response.');
        }

        SObject rec = recordId.getSobjectType().newSObject(recordId);
        rec.put('Service_Quality_Analysis__c', text);
        update rec;
        return text;
    }
}

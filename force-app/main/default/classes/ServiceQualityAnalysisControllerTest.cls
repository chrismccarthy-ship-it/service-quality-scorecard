@IsTest
private class ServiceQualityAnalysisControllerTest {

    @IsTest
    static void rejectsUnsupportedObject() {
        Account a = new Account(Name = 'Test');
        insert a;
        try {
            ServiceQualityAnalysisController.runAnalysis(a.Id);
            System.assert(false, 'Expected an exception');
        } catch (AuraHandledException e) {
            System.assert(true);
        }
    }

    @IsTest
    static void parserReadsScore() {
        String json = '```json {"RepEffectivenessScore":{"score":82}} ```'.replace('```json ', '```json\n');
        List<Integer> out = ServiceQualityScoreParser.parseScore(new List<String>{ json });
        System.assertEquals(82, out[0]);
    }
}

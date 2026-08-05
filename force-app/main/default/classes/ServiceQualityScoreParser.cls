public class ServiceQualityScoreParser {

    @InvocableMethod(
        label='Parse Service Quality Score'
        description='Extracts the numeric score from the Service Quality Analysis JSON'
    )
    public static List<Integer> parseScore(List<String> jsonInputs) {
        List<Integer> scores = new List<Integer>();
        for (String jsonInput : jsonInputs) {
            try {
                String cleaned = jsonInput;
                cleaned = cleaned.replaceAll('```json', '');
                cleaned = cleaned.replaceAll('```', '');
                cleaned = cleaned.trim();

                Map<String, Object> parsed = (Map<String, Object>) JSON.deserializeUntyped(cleaned);
                Map<String, Object> effectiveness = (Map<String, Object>) parsed.get('RepEffectivenessScore');
                Integer score = (Integer) effectiveness.get('score');
                scores.add(score);
            } catch (Exception e) {
                scores.add(-1);
            }
        }
        return scores;
    }
}

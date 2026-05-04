public with sharing class PropertyController {

    @AuraEnabled(cacheable=true)
    public static Integer getTotalCount(
        String status,
        String furnishing,
        Decimal minPrice,
        Decimal maxPrice
    ){
        String query = 'SELECT COUNT() FROM Property__c WHERE Id != null';

        if(String.isNotBlank(status)){
            query += ' AND Status__c = :status';
        }
        if(String.isNotBlank(furnishing)){
            query += ' AND Furnishing_Status__c = :furnishing';
        }
        if(minPrice != null){
            query += ' AND Rent__c >= :minPrice';
        }
        if(maxPrice != null){
            query += ' AND Rent__c <= :maxPrice';
        }

        return Database.countQuery(query);
    }

    @AuraEnabled(cacheable=true)
    public static List<Property__c> getProperties(
        Integer pageSize,
        Integer pageNumber,
        String status,
        String furnishing,
        Decimal minPrice,
        Decimal maxPrice
    ){
        Integer offsetValue = (pageNumber - 1) * pageSize;

        String query = 'SELECT Id, Name, Rent__c, Status__c, Furnishing_Status__c FROM Property__c WHERE Id != null';

        if(String.isNotBlank(status)){
            query += ' AND Status__c = :status';
        }
        if(String.isNotBlank(furnishing)){
            query += ' AND Furnishing_Status__c = :furnishing';
        }
        if(minPrice != null){
            query += ' AND Rent__c >= :minPrice';
        }
        if(maxPrice != null){
            query += ' AND Rent__c <= :maxPrice';
        }

        query += ' ORDER BY CreatedDate DESC LIMIT :pageSize OFFSET :offsetValue';

        return Database.query(query);
    }

    @AuraEnabled
    public static void linkFilesToRecord(List<Id> contentDocumentIds, Id recordId) {

        List<ContentDocumentLink> links = new List<ContentDocumentLink>();

        for (Id docId : contentDocumentIds) {
            links.add(new ContentDocumentLink(
                ContentDocumentId = docId,
                LinkedEntityId = recordId,
                ShareType = 'V',
                Visibility = 'AllUsers'
            ));
        }

        if(!links.isEmpty()){
            insert links;
        }
    }
}
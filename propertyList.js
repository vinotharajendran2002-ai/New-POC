import { LightningElement, track } from 'lwc';
import getProperties from '@salesforce/apex/PropertyController.getProperties';
import getTotalCount from '@salesforce/apex/PropertyController.getTotalCount';
import linkFilesToRecord from '@salesforce/apex/PropertyController.linkFilesToRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class PropertyList extends LightningElement {

    @track properties = [];
    @track noData = false;

    pageSize = 25;
    pageNumber = 1;
    totalPages = 1;

    minPrice;
    maxPrice;
    status;
    furnishing;

    disableNext = false;
    disablePrevious = true;

    isSearchClicked = false;

    showCreateForm = false;
    uploadedFileIds = [];
    imageError = false;

    columns = [
        { label: 'Name', fieldName: 'Name' },
        { label: 'Rent', fieldName: 'Rent__c', type: 'currency' },
        { label: 'Status', fieldName: 'Status__c' },
        { label: 'Furnishing', fieldName: 'Furnishing_Status__c' }
    ];

    statusOptions = [
               
        { label: 'Available', value: 'Available' },
        { label: 'Occupied', value: 'Occupied' }
    ];

    furnishingOptions = [
               
        { label: 'Fully Furnished', value: 'Fully Furnished' },
        { label: 'Semi-Furnished', value: 'Semi-Furnished' },
        { label: 'Unfurnished', value: 'Unfurnished' }
    ];

    handleSearch() {
        if (!this.minPrice && !this.maxPrice && !this.status && !this.furnishing) {
            this.showToast('Error', 'Please enter at least one filter', 'error');
            return;
        }

        this.isSearchClicked = true;
        this.pageNumber = 1;
        this.loadData();
    }

    handleRefresh() {
        this.minPrice = null;
        this.maxPrice = null;
        this.status = '';
        this.furnishing = '';
        this.pageNumber = 1;
        this.isSearchClicked = false;
        this.properties = [];
    }

    loadData() {
        getTotalCount({
            status: this.status,
            furnishing: this.furnishing,
            minPrice: this.minPrice,
            maxPrice: this.maxPrice
        })
        .then(total => {
            this.totalPages = Math.ceil(total / this.pageSize) || 1;

            return getProperties({
                pageSize: this.pageSize,
                pageNumber: this.pageNumber,
                status: this.status,
                furnishing: this.furnishing,
                minPrice: this.minPrice,
                maxPrice: this.maxPrice
            });
        })
        .then(result => {
            this.properties = result;
            this.noData = result.length === 0;

            this.disablePrevious = this.pageNumber === 1;
            this.disableNext = this.pageNumber >= this.totalPages;
        })
        .catch(error => {
            console.error(error);
        });
    }

    handleMinPrice(e) { this.minPrice = e.target.value; }
    handleMaxPrice(e) { this.maxPrice = e.target.value; }
    handleStatus(e) { this.status = e.detail.value; }
    handleFurnishing(e) { this.furnishing = e.detail.value; }

    nextPage() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.loadData();
        }
    }

    previousPage() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.loadData();
        }
    }

    openCreateForm() {
        this.showCreateForm = true;
    }

    closeCreateForm() {
        this.showCreateForm = false;
        this.uploadedFileIds = [];
        this.imageError = false;
    }

    handleUploadFinished(event) {
        this.imageError = false;
        this.uploadedFileIds = [];

        event.detail.files.forEach(file => {
            this.uploadedFileIds.push(file.documentId);
        });
    }

    handleCreate() {
        if (this.uploadedFileIds.length === 0) {
            this.imageError = true;
            return;
        }

        this.template.querySelector('lightning-record-edit-form').submit();
    }

    handleSuccess(event) {
        linkFilesToRecord({
            contentDocumentIds: this.uploadedFileIds,
            recordId: event.detail.id
        });

        this.showToast('Success', 'Property Created Successfully', 'success');

        this.closeCreateForm();

        this.isSearchClicked = false;
        this.properties = [];
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }
}
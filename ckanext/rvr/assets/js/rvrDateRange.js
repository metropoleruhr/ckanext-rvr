// Declare daterange fields
const daterangeFields = {
    'metadata_created': 'Date Created',
    'metadata_modified': 'Last Updated',
    'issued': 'Issued',
    'modified': 'Modified'
};

// Generate field id from facet name
const fieldId = name => `#daterange-input-field`;

/**
 * Generate the url for daterange search parameters
 * @param {String} facet 
 * @param {Moment} startDate 
 * @param {Moment} endDate 
 * @returns new url string with search parameters
 */
const generateFilterHref = (facet, startDate, endDate) => {
    let oldUrl = new URL(document.location.href);
    let start = startDate.format('DD-MM-YYYY');
    let end = endDate.format('DD-MM-YYYY');

    Object.keys(daterangeFields).forEach(key => {
        oldUrl.searchParams.delete(`_${key}_start`);
        oldUrl.searchParams.delete(`_${key}_end`);
    });
    oldUrl.searchParams.delete('page');
    oldUrl.searchParams.delete('_active_range');

    let bridge = oldUrl.search.trim() ? '&' : '?';

    const startParam = `_${facet}_start=${start}`;
    const endParam = `_${facet}_end=${end}`;
    const active = `_active_range=${facet}`;

    let facetQuery = `${startParam}&${endParam}&${active}`

    return `${oldUrl.href}${bridge}${facetQuery}`
}

/**
 * Removes a search parameter and returns a new page without the removed
 * parameter
 * @param {Event} event 
 * @param {String} facet 
 * @param {String} type 
 */
const cancelDaterangeFilterItem = (event, facet, type) => {
    event.preventDefault();
    parentSpan = event.target.closest('span.filtered.pill');
    let url = new URL(document.location.href);

    url.searchParams.delete('page');
    if (type === 'min') url.searchParams.delete(`_${facet}_start`);
    if (type === 'max') url.searchParams.delete(`_${facet}_end`);

    document.location.href = url.href;
}

/**
 * Generates filter list elements in the DOM for the dateranges
 * @param {String} item facet name 
 * @param {String} minFilter start date
 * @param {String} maxFilter end date
 */
const addFilterListItem = (item, minFilter, maxFilter) => {
    // Get parent element
    const parentElement = document.querySelector('p.filter-list');
    
    // Create element for facet display name
    const titleSpan = document.createElement('span');
    titleSpan.className = 'facet';
    titleSpan.innerText = ` ${daterangeFields[item]}: `;

    /**
     * Generates an anchor element that removes a daterange filter when
     * clicked
     * @param {String} type filter type either `min` or `max`
     * @returns HTML anchor element
     */
    const generateCancelAnchor = type => {
        const cancelAnchor = document.createElement('a');
        cancelAnchor.className = 'remove';
        cancelAnchor.href = ''
        const cancelIcon = document.createElement('i');
        cancelIcon.className = 'fa fa-times';
        cancelAnchor.appendChild(cancelIcon);
        cancelAnchor.onclick = ev => {
            cancelDaterangeFilterItem(ev, item, type);
        }
        return cancelAnchor;
    }

    /**
     * Generates the filter items
     * @param {String} filter date string
     * @param {String} type filter type either `min` or `max`
     * @returns filter pill HTMLSpanElement
     */
    const generateFilterPillSpan = (filter, type) => {
        const filterPill = document.createElement('span');
        filterPill.className = 'filtered pill';
        filterPill.innerText = `${type}:  ${filter} `;
        filterPill.appendChild(generateCancelAnchor(type));
        return filterPill;
    }

    if (minFilter || maxFilter) {
        parentElement.appendChild(titleSpan);
        if (minFilter) parentElement.appendChild(
            generateFilterPillSpan(minFilter, 'min'));
        if (maxFilter) parentElement.appendChild(
            generateFilterPillSpan(maxFilter, 'max'));
    }
}

/**
 * Generate the DateRanger picker feature in the DOM
 * @param {String} item facet name 
 */
const generateDaterangePicker = (item) => {

    const initialData = $(fieldId(item)).data()
    let start = moment();
    let end = moment();
    let minFilter = '';
    let maxFilter = '';
    if (initialData.startdate) {
        start = moment(initialData.startdate, 'DD-MM-YYYY');
        minFilter = start.format('DD MMMM, YYYY');
    }
    if (initialData.enddate) {
        end = moment(initialData.enddate, 'DD-MM-YYYY');
        maxFilter = end.format('DD MMMM, YYYY');
    }

    addFilterListItem(item, minFilter, maxFilter)

    $(fieldId(item)).daterangepicker({
        "showDropdowns": true,
        "startDate": start.format('DD MMMM, YYYY'),
        "endDate": end.format('DD MMMM, YYYY'),
        "ranges": {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        },
        "linkedCalendars": false,
        "locale": {
            "format": "DD MMMM, YYYY",
            "separator": " - ",
            "applyLabel": "Apply",
            "cancelLabel": "Cancel",
            "fromLabel": "From",
            "toLabel": "To",
            "customRangeLabel": "Custom Range",
            "alwaysShowCalendars": true,
            "weekLabel": "W",
            "daysOfWeek": [ "Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat" ],
            "monthNames": [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December"
            ]
        },
    }, (start, end, label) => {
        const facet = $('#daterange-select').val();
        const newUrl = generateFilterHref(facet, start, end);
        document.location.href = newUrl;
    });
}

$(function() {
    generateDaterangePicker($('#daterange-select').val());
});

// Declare daterange fields
const daterangeFields = {
    'metadata_created': 'Erstellt',
    'metadata_modified': 'Zuletzt Aktualisiert',
    'issued': 'Veröffentlicht',
    'modified': 'Zuletzt Geändert'
};

// Generate field id from facet name
const fieldId = '#daterange-input-field';

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
 * Get the date passed from the backend or default to today
 * 
 * @returns an array of the start and end dates and the min and max filter texts
 */
const getFieldData = () => {
    const initialData = $(fieldId).data()
    let start = moment();
    let end = moment();
    let minFilter = '';
    let maxFilter = '';
    if (initialData.startdate) {
        start = moment(initialData.startdate, 'DD-MM-YYYY');
        minFilter = start.format('DD.MM.YYYY');
    }
    if (initialData.enddate) {
        end = moment(initialData.enddate, 'DD-MM-YYYY');
        maxFilter = end.format('DD.MM.YYYY');
    }

    return [start, end, minFilter, maxFilter]
}

/**
 * Generate the DateRanger picker feature in the DOM
 * @param {String} item facet name 
 */
const generateDaterangePicker = (item) => {

    [start, end, minFilter, maxFilter] = getFieldData();

    addFilterListItem(item, minFilter, maxFilter)

    $(fieldId).daterangepicker({
        "showDropdowns": true,
        "startDate": start.format('DD.MM.YYYY'),
        "endDate": end.format('DD.MM.YYYY'),
        "linkedCalendars": false,
        "locale": {
            "format": "DD.MM.YYYY",
            "separator": " - ",
            "applyLabel": "Speichern",
            "cancelLabel": "Abbrechen",
            "fromLabel": "From",
            "toLabel": "To",
            "customRangeLabel": "Custom Range",
            "alwaysShowCalendars": true,
            "weekLabel": "W",
            "daysOfWeek": ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
            "monthNames": [
                "Januar",
                "Februar",
                "März",
                "April",
                "Mai",
                "Juni",
                "Juli",
                "August",
                "September",
                "Oktober",
                "November",
                "Dezember"
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

    $('#daterange-select').on('change', () => {
        [start, end] = getFieldData();

        const facet = $('#daterange-select').val();
        const newUrl = generateFilterHref(facet, start, end);
        document.location.href = newUrl;
    });
});

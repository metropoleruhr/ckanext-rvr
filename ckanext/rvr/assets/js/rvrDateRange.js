const daterangeFields = {
    'metadata_created': 'Date Created',
    'metadata_modified': 'Last Updated',
    'issued': 'Issued',
    'modified': 'Modified'
};
const fieldId = name => `#${name}-daterange-field`;

const generateFilterHref = (facet, startDate, endDate) => {
    let oldUrl = new URL(document.location.href);
    let start = startDate.format('DD-MM-YYYY');
    let end = endDate.format('DD-MM-YYYY');
    
    if (oldUrl.searchParams.getAll(`_${facet}_start`).length ||
        oldUrl.searchParams.getAll(`_${facet}_end`).length) {
        oldUrl.searchParams.delete(`_${facet}_start`);
        oldUrl.searchParams.delete(`_${facet}_end`);
        oldUrl.searchParams.delete('page');
    }

    let bridge = oldUrl.search.trim() ? '&' : '?';

    const startParam = `_${facet}_start=${start}`;
    const endParam = `_${facet}_end=${end}`;

    let facetQuery = `${startParam}&${endParam}`

    return `${oldUrl.href}${bridge}${facetQuery}`
}

const cancelDaterangeFilterItem = (event, facet, type) => {
    event.preventDefault();
    parentSpan = event.target.closest('span.filtered.pill');
    let url = new URL(document.location.href);

    url.searchParams.delete('page');
    if (type === 'min') url.searchParams.delete(`_${facet}_start`);
    if (type === 'max') url.searchParams.delete(`_${facet}_end`);

    document.location.href = url.href;
}

const addFilterListItem = (item, minFilter, maxFilter) => {
    const parentElement = document.querySelector('p.filter-list');
    
    const titleSpan = document.createElement('span');
    titleSpan.className = 'facet';
    titleSpan.innerText = ` ${daterangeFields[item]}: `;

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
        const newUrl = generateFilterHref(item, start, end);
        document.location.href = newUrl;
    });
}

$(function() {
    Object.keys(daterangeFields).forEach(item => {
        generateDaterangePicker(item);
    });

});


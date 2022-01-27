const daterangeFields = ['metadata_created', 'metadata_modified', 'issued', 'modified'];
const fieldId = name => `#${name}-daterange-field`;

const generateFilterHref = (facet, startDate, endDate) => {
    let oldUrl = new URL(document.location.href);
    let start = startDate.format('DD-MM-YYYY');
    let end = endDate.format('DD-MM-YYYY');
    
    if (oldUrl.searchParams.getAll(`_${facet}_start`).length ||
        oldUrl.searchParams.getAll(`_${facet}_end`).length) {
        oldUrl.searchParams.delete(`_${facet}_start`);
        oldUrl.searchParams.delete(`_${facet}_end`);
    }

    let bridge = oldUrl.search.trim() ? '&' : '?';

    const startParam = `_${facet}_start=${start}`;
    const endParam = `_${facet}_end=${end}`;

    let facetQuery = `${startParam}&${endParam}`

    return `${oldUrl.href}${bridge}${facetQuery}`
}

const generateDaterangePicker = (item) => {

    const initialData = $(fieldId(item)).data()
    let start = moment();
    let end = moment();
    if (initialData.startdate) {
        start = moment(initialData.startdate, 'DD-MM-YYYY');
    }
    if (initialData.enddate) {
        end = moment(initialData.enddate, 'DD-MM-YYYY');
    }    

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
    daterangeFields.forEach(item => {
        generateDaterangePicker(item);
    });

});


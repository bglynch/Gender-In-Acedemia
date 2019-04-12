/*global queue, d3, crossfilter, dc */
queue()
    .defer(d3.csv, "data/Bed-Numberss.csv")
    .await(makeGraphs);

function makeGraphs(error, salaryData) {
    var ndx = crossfilter(salaryData);

    makeSelectMunu(ndx, "Year", "#beds-year");
    makeRowChart(ndx, "Bed Type", "Total", "#beds-type", 350, 250);
    makeRowChart(ndx, "Hospital Group", "Total", "#beds-hospital-group", 350, 250);
    // makeRowChart(ndx, 'Bed Type', "Total", '#beds-bed-type', 350, 250);
    
    makeRowChart(ndx, 'Hospital', "Total", '#beds-hospital', 600, 1000);

    dc.renderAll();
}

// var filtered_group = remove_empty_bins(group); // or filter_bins, or whatever
function remove_empty_bins(source_group) {
    return {
        all: function() {
            return source_group.all().filter(function(d) {
                //return Math.abs(d.value) > 0.00001; // if using floating-point numbers
                return d.value !== 0; // if integers only
            });
        }
    };
}

function makeSelectMunu(ndx, dimension_pluck, html_id) {
    var disciplineDim = ndx.dimension(dc.pluck(dimension_pluck));
    var disciplineSelect = disciplineDim.group();

    dc.selectMenu(html_id)
        .dimension(disciplineDim)
        .group(disciplineSelect);
}

function makeBarChart(ndx, dimension_pluck, group_sum_pluck, html_id, width, height) {
    var genderDim = ndx.dimension(dc.pluck(dimension_pluck));
    var genderMix = genderDim.group().reduceSum(dc.pluck(group_sum_pluck));

    dc.barChart(html_id)
        .width(width)
        .height(height)
        .margins({ top: 10, right: 50, bottom: 30, left: 50 })
        .dimension(genderDim)
        .group(remove_empty_bins(genderMix))
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticX(true)
        .elasticY(true)
        .yAxis().ticks(20);
}

function makeRowChart(ndx, dimension_pluck, group_sum_pluck, html_id, width, height) {
    var dim = ndx.dimension(dc.pluck(dimension_pluck));
    var group = dim.group().reduceSum(dc.pluck(group_sum_pluck));

    dc.rowChart(html_id)
        .width(width)
        .height(height)
        .dimension(dim)
        .group(group)
        .elasticX(true)
        .xAxis().ticks(4);
}

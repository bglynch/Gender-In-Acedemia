/*global queue, d3, crossfilter, dc */
queue()
    .defer(d3.csv, "data/IPDC-Waiting-List-By-Group-Hospital-2019.csv")
    .await(makeGraphs);

function makeGraphs(error, salaryData) {
    var ndx = crossfilter(salaryData);

    salaryData.forEach(function(d) {
        // d.salary = parseInt(d.salary);
        // d.yrs_since_phd = parseInt(d["yrs.since.phd"]);
        // d.yrs_service = parseInt(d["yrs.service"]);
    });

    makeSelectMunu(ndx, "Archive_Date", "#IDPC-discipline-selector");
    makeBarChart(ndx, "Case_Type", "Total", "#IDPC-case-type", 350, 250);
    makeBarChart(ndx, "Age_Profile", "Total", "#IDPC-age-profile", 350, 250);
    makeBarChart(ndx, "Time_Bands", "Total", "#IDPC-waiting-time", 350, 250);
    makeRowChart(ndx, 'Hospital_Group', "Total", '#IDPC-hospital-group', 350, 250);
    
    makeRowChart(ndx, 'Hospital_Name', "Total", '#IDPC-hospital', 600, 1000);
    makeRowChart(ndx, 'Specialty_Name', "Total", '#IDPC-speciality', 600, 1000);

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

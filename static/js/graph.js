/*global queue, d3, crossfilter, dc */
queue()
    .defer(d3.csv, "data/Salaries.csv")
    .await(makeGraphs);


function makeGraphs(error, salaryData) {
    var ndx = crossfilter(salaryData);

    salaryData.forEach(function(d){
        d.salary = parseInt(d.salary);
        d.yrs_since_phd = parseInt(d["yrs.since.phd"]);
        d.yrs_service = parseInt(d["yrs.service"]);
    });


    show_discipline_selector(ndx);
    show_percent_that_are_professors(ndx, "Female", "#percent-of-women-professors");
    show_percent_that_are_professors(ndx, "Male", "#percent-of-men-professors");
    show_gender_balance(ndx);
    show_average_salaries(ndx);
    show_rank_distribution(ndx);
    show_service_to_salary_correlation(ndx);
    show_phd_to_salary_correlation(ndx);

    dc.renderAll();
}

// var ndx = crossfilter(...)
// var dim = ndx.dimension(...)
// var group = dim.group(...) ... 

// var filtered_group = remove_empty_bins(group) // or filter_bins, or whatever

// chart.dimension(dim)
//     .group(filtered_group)
//     ...



var filtered_group = remove_empty_bins(group) // or filter_bins, or whatever
function remove_empty_bins(source_group) {
    return {
        all:function () {
            return source_group.all().filter(function(d) {
                //return Math.abs(d.value) > 0.00001; // if using floating-point numbers
                return d.value !== 0; // if integers only
            });
        }
    };
}


// Drop down selection menu
function show_discipline_selector(ndx) {
    var disciplineDim = ndx.dimension(dc.pluck("discipline"));
    var disciplineSelect = disciplineDim.group();

    dc.selectMenu("#discipline-selector")
        .dimension(disciplineDim)
        .group(disciplineSelect);
}

// Percentage 
function show_percent_that_are_professors(ndx, gender, element) {
    var percentageThatAreProf = ndx.groupAll().reduce(
        function (p, v) {
            if (v.sex === gender) {
                p.count++;
                if (v.rank === "Prof") {
                   p.are_prof++;
                }
            }
            return p;
        },
        function (p, v) {
            if (v.sex === gender) {
                p.count--;
                if (v.rank === "Prof") {
                   p.are_prof--;
                }
            }
            return p;
        },
        function () {
            return {count: 0, are_prof: 0};
        }
    );

    dc.numberDisplay(element)
        .formatNumber(d3.format(".2%"))
        .valueAccessor(function (d) {
            if (d.count == 0) {
                return 0;
            } else {
                return (d.are_prof / d.count);
            }
        })
        .group(percentageThatAreProf);
}

// Bar chart
function show_gender_balance(ndx) {
    var genderDim = ndx.dimension(dc.pluck("sex"));
    var genderMix = genderDim.group();

    dc.barChart("#gender-balance")
        .width(350)
        .height(250)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(genderDim)
        .group(remove_empty_bins(genderMix))
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticX(true)
        .elasticY(true)
        .xAxisLabel("Gender")
        .yAxis().ticks(20);
        
    //     spendHistChart
    // .width(300).height(200)
    // .dimension(spendDim)
    // .group(nonEmptyHist)
    // .x(d3.scaleBand())
    // .xUnits(dc.units.ordinal)
    // .elasticX(true)
    // .elasticY(true);
}



// Bar chart
function show_average_salaries(ndx) {
    var genderDim = ndx.dimension(dc.pluck("sex"));
    var averageSalaryByGender = genderDim.group().reduce(
        function (p, v) {
            p.count++;
            p.total += v.salary;
            return p;
        },
        function (p, v) {
            p.count--;
            if (p.count == 0) {
                p.total = 0;
            } else {
                p.total -= v.salary;
            }
            return p;
        },
        function () {
            return {count: 0, total: 0};
        }
    );

    dc.barChart("#average-salary")
        .width(350)
        .height(250)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(genderDim)
        .group(averageSalaryByGender)
        .valueAccessor(function (d) {
            if (d.value.count == 0) {
                return 0;
            } else {
                return d.value.total / d.value.count;
            }
        })
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .xAxisLabel("Gender")
        .yAxis().ticks(4);
}

// Stacked bar chart
function show_rank_distribution(ndx) {

    function rankByGender(dimension, rank) {
        return dimension.group().reduce(
            function (p, v) {
                p.total++;
                if (v.rank === rank) {
                    p.match++;
                };
                return p;
            },
            function (p, v) {
                p.total--;
                if (v.rank === rank) {
                    p.match--;
                };
                return p;
            },
            function () {
                return { total: 0, match: 0 }
            }
        );
    };

    var dim = ndx.dimension(dc.pluck("sex"));
    var profByGender = rankByGender(dim, "Prof");
    var asstProfByGender = rankByGender(dim, "AsstProf");
    var assocProfByGender = rankByGender(dim, "AssocProf");
    
    dc.barChart("#rank-distribution")
        .width(350)
        .height(250)
        .dimension(dim)
        .group(profByGender, "Prof")
        .stack(asstProfByGender, "AsstProf")
        .stack(assocProfByGender, "AssocProf")
        .valueAccessor(function (d) {
            if(d.value.total > 0) {
                return (d.value.match / d.value.total) * 100
            } else {
                return 0;
            }
            return d.value.percent * 100;
        })
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Gender")
        .legend(dc.legend().x(270).y(170).itemHeight(15).gap(5))
        .margins({top: 10, right: 100, bottom: 30, left: 30});
}

// Scatter plot
function show_service_to_salary_correlation(ndx) {
    var genderColors = d3.scale.ordinal()
        .domain(["Female", "Male"])
        .range(["pink", "blue"]);

    var eDim = ndx.dimension(dc.pluck("yrs_service"));
    var experienceDim = ndx.dimension(function(d){
        return [d.yrs_service, d.salary, d.rank, d.sex];
    });
    var experienceSalaryGroup = experienceDim.group();

    var minExperience = eDim.bottom(1)[0].yrs_service;
    var maxExperience = eDim.top(1)[0].yrs_service;

    dc.scatterPlot("#service-salary")
        .width(800)
        .height(400)
        .x(d3.scale.linear().domain([minExperience,maxExperience]))
        .elasticX(true)
        .elasticY(true)
        .brushOn(false)
        .symbolSize(8)
        .clipPadding(10)
        .yAxisLabel("Salary")
        .xAxisLabel("Years Of Service")
        .title(function (d) {
            return d.key[2] + " earned " + d.key[1];
        })
        .colorAccessor(function (d) {
            return d.key[3];
        })
        .colors(genderColors)
        .dimension(experienceDim)
        .group(remove_empty_bins(experienceSalaryGroup))
        .margins({top: 10, right: 50, bottom: 75, left: 75});
}


function show_phd_to_salary_correlation(ndx) {
    var genderColors = d3.scale.ordinal()
        .domain(["Female", "Male"])
        .range(["pink", "blue"]);

    var pDim = ndx.dimension(dc.pluck("yrs_since_phd"));
    var phdDim = ndx.dimension(function(d){
        return [d.yrs_since_phd, d.salary, d.rank, d.sex];
    });
    var phdSalaryGroup = phdDim.group();

    var minPhd = pDim.bottom(1)[0].yrs_since_phd;
    var maxPhd = pDim.top(1)[0].yrs_since_phd;

    dc.scatterPlot("#phd-salary")
        .width(800)
        .height(400)
        .x(d3.scale.linear().domain([minPhd,maxPhd]))
        .brushOn(false)
        .symbolSize(8)
        .clipPadding(10)
        .yAxisLabel("Salary")
        .xAxisLabel("Years Since PhD")
        .title(function (d) {
            return d.key[2] + " earned " + d.key[2];
        })
        .colorAccessor(function (d) {
            return d.key[3];
        })
        .colors(genderColors)
        .dimension(phdDim)
        .group(phdSalaryGroup)
        .margins({top: 10, right: 50, bottom: 75, left: 75});
}
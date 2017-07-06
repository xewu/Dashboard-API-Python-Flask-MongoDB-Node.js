queue()
	    .defer(d3.json, "/airbnb/projects")
		.defer(d3.json, "static/geojson/countries.json")
		.await(makeGraphs);
        function makeGraphs(error, projectsJson, countryJson) {
            var airbnbProjects = projectsJson;
            var dateFormat = d3.time.format("%Y-%m-%d");
            airbnbProjects.forEach(function (d) {
                d["date_first_booking"] = dateFormat.parse(d["date_first_booking"]);
                d["date_first_booking"].setDate(1);
                d["count"] += d["count"];
            });
            var ndx = crossfilter(airbnbProjects);
            var dateDim = ndx.dimension(function (d) { return d["date_first_booking"]; });
            var deviceTypeDim = ndx.dimension(function(d) { return d["first_device_type"]; });
            var providerAfDim = ndx.dimension(function(d) { return d["affiliate_provider"]; });
            var countryDim = ndx.dimention(function(d) { return d["country_destination"]; });
            var totalBookingsDim = ndx.dimension(function(d) { return d["count"]; });

            var all = ndx.groupAll();
            var numProjectsByDate = dataDim.group();
            var numProjectsByDevice = deviceTypeDim.group();
            var numProjectsByProvider = providerAfDim.group();
            var totalBookingByCountry = countryDim.group().reduceSum(function (d) {
                return d["count"];
            });
            var totalBookings = ndx.groupAll().reduceSum(function (d) {
                return d["count"];
            });

            var max_country = totalBookingByCountry.top(1)[0].value;
            var minDate = dateDim.bottom(1)[0]["date_first_booking"];
            var maxDate = dateDim.top(1)[0] ["date_first_booking"];

            var timeChart = dc.barChart("#time-chart");
            var deviceTypeChart = dc.rowChart("#device-type-row-chart");
            var providerTypeChart = dc.rowChart("#provider-type-row-chart");
            var worldChart = dc.geoChoroplethChart("#world-chart");
            var numberProjectsND = dc.numberDisplay("#number-projects-nd");
            var totalBookingsND =dc.numberDisplay("#total-bookings-nd");

            numberProjectsND
                .formatNumber(d3.format("d"))
                .valueAccessor(function (d) { return d; })
                .group(all);

            totalBookingsND
                .formatNumber(d3.format("d"))
                .valueAccessor(function (d) { return d; })
                .group(totalBookings)
                .formatNumber(d3.format(".3s"));

            timeChart
                .width(600)
                .height(160)
                .margins({top: 10, right: 50, bottom: 30, left: 50})
                .dimension(dateDim)
                .group(numProjectsByDate)
                .transitionDuration(500)
                .x(d3.time.scale().domain([minDate, maxDate]))
                .elasticY(true)
                .xAxisLabel("Year")
                .yAxis().ticks(4);

            deviceTypeChart
                .width(300)
                .height(250)
                .dimension(deviceTypeDim)
                .group(numProjectsByDevice)
                .xAxis().ticks(4);

            providerTypeChart
                .width(300)
                .height(250)
                .dimension(providerAfDim)
                .group(numProjectsByProvider)
                .xAxis().ticks(4);

            worldChart
                .width(1000)
                .height(330)
                .dimension(countryDim)
                .group(totalBookingByCountry)
                .colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", 
                    "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", 
                    "#0089FF", "#0061B5"])
                .colorDomain([0, max_country])
                .overlayGeoJson(countryJson["features"], "country", function (d) {
                    return d.properties.name;
                })
                .projection(d3.geo.albersUsa()
                    .scale(600)
                    .translate([340, 150]))
                .title(function (p) {
                    return "Country: " + p["key"]
                    + "\n"
                    + "Total Bookings: " + Math.round(p["value"]);
                });

            dc.renderAll();
        };
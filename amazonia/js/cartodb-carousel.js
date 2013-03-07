// NOTICE!! DO NOT USE ANY OF THIS JAVASCRIPT
// IT'S ALL JUST JUNK FOR OUR DOCS!
// ++++++++++++++++++++++++++++++++++++++++++

!function ($) {

  $(function(){

    var $window = $(window)

      var carousel_options = {
        domain: 'biota',
        max_stops: 9
      }
      var map = L.map('map', { 
        zoomControl: true,
        center: [-2.86, -53.73],
        zoom: 5
      })

      // add a nice baselayer from mapbox
      L.tileLayer("http://d.tiles.mapbox.com/v3/robgur.map-62cjw4sm/{z}/{x}/{y}.png", {
        attribution: 'MapBox'
      }).addTo(map);

    var carousel = new Array();
    var layers = new Array();
    var sql = new cartodb.SQL({ user: carousel_options.domain});
    var stop_carousel = false;
    var click_carousel = false;
    var current_stop = -1;
    var current_map_layer;
    var map_options = {infowindow: false};

    var pre_i = 1; //skips the first layer at 0 so not to double load a map
    function preload_maps(){
      if (carousel[pre_i].type == 'cartodb') {
        if (carousel[pre_i].layer) {
          pre_i++;
          if (pre_i < carousel_options.max_stops) {
            setTimeout(preload_maps, 0);
            return true;
          }
        } else {
          for (var attrname in map_options) { carousel[pre_i].options[attrname] = map_options[attrname]; }
          cartodb.createLayer(map, carousel[pre_i].cartodb_url, carousel[pre_i].options, function(layer) {
            carousel[pre_i].layer = layer;
            pre_i++;
            if (pre_i < carousel_options.max_stops) {
              setTimeout(preload_maps, 0);
              return true;
            }
          });
        }
      } else if (carousel[pre_i].type == 'image') {
        if(carousel[pre_i].img){
          pre_i++;
          if (pre_i < carousel_options.max_stops) {
            setTimeout(preload_maps, 0);
            return true;
          }
        } else {
          carousel[pre_i].img = new Image();
          carousel[pre_i].img.src = carousel[pre_i].identifier;
          carousel[pre_i].img.onload = function(){
            pre_i++;
            if (pre_i < carousel_options.max_stops) {
              setTimeout(preload_maps, 0);
              return true;
            }
          }
        }
      } else {
        pre_i++;
        if (pre_i < carousel_options.max_stops) {
          setTimeout(preload_maps, 0);
          return true;
        }
      }
    }
    function spin(){
      // If the carousel wasn't manually forwarded, and isn't
      // running, then don't spin again
      if (!click_carousel){
        if (stop_carousel){
          return false;
        }
      }
      click_carousel = false;

      // change to our new stop
      if (current_stop >= carousel_options.max_stops - 1){
        current_stop = 0;
      } else {
        current_stop++;
      }

      if (carousel[current_stop].type == 'cartodb') {
        if (current_map_layer){
          map.removeLayer(current_map_layer);
        }
        if (carousel[current_stop].layer) {
          current_map_layer = carousel[current_stop].layer;
          map.addLayer(current_map_layer);
          current_map_layer.setInteraction(false);
        } else {
          cartodb.createLayer(map, carousel[current_stop].cartodb_url, carousel[current_stop].options, function(layer) {
            carousel[current_stop].layer = layer;
            current_map_layer = carousel[current_stop].layer;
            map.addLayer(current_map_layer);
          });
        }
        $("#map").css({'z-index': '1'})
        $("#hero-image").css({'z-index': '-1000'})
      }
      else if (carousel[current_stop].type == 'image') {
          $("#hero-image img").remove();
        if(carousel[current_stop].img){
          $("#hero-image").append(carousel[current_stop].img);
          $("#hero-image img").css({'margin-top': (400 - $(carousel[current_stop].img).height()) / 2});
            //$("#hero-image img").css({'margin-top': (400 - $(carousel[current_stop].img).height()) / 2});
        } else {
          carousel[current_stop].img = new Image();
          carousel[current_stop].img.src = carousel[current_stop].identifier;
          carousel[current_stop].img.onload = function(){
            $("#hero-image").append(carousel[current_stop].img);
            var w = $(carousel[current_stop].img).width();
            // $("#hero-image img").css({'display':'block','margin': "auto auto"});
            $("#hero-image img").css({'margin-top': (400 - $(carousel[current_stop].img).height()) / 2});
          }
        }

        $("#map").css({'z-index': '-1000'})
        $("#hero-image").css({'z-index': '1'});
      }
      $('.map-title h4').html(carousel[current_stop].title);
      $('.map-title span').html(carousel[current_stop].credit);
      $('.map-title p').html(carousel[current_stop].blurb);
      // change the selector dot highlighted
      $('.pagination li').removeClass('active');
      $('.pagination ul li').eq(current_stop).addClass('active');

      // don't run the carousel again if it was manually forwarded
      if (stop_carousel){
        return true;
      } else {
        setTimeout(spin, 11000);
      }
    }

    $('.pagination li a.frame').click(function(){
      $('.pagination li').removeClass('active');
      $(this).parent().addClass('active');
      stop_carousel = true;
      click_carousel = true;
      current_stop = $(this).html() - 2 ;
      spin();
    });

    //keep our carousel images vertically centered
    $(window).bind("resize", function(){
      if($("#hero-image img")){
        $("#hero-image img").css({'margin-top': (400 - $(carousel[current_stop].img).height()) / 2});
      }
    });


    sql.execute("SELECT blurb,identifier,title,type,credit,sql,style FROM {{table_name}} ORDER BY display_order ASC LIMIT 9", {table_name: 'carousel_controller'})
      .done(function(data) {
        for (var i=0; i<data.rows.length; i++){
          if (data.rows[i].type == 'cartodb') {
            data.rows[i].cartodb_url = 'http://'+carousel_options.domain+'.cartodb.com/api/v1/viz/'+data.rows[i].identifier+'/viz.json'
            data.rows[i].options = {};
            if (data.rows[i].sql != null){
              data.rows[i].options.query = data.rows[i].sql;
            }
          } 
        }
        carousel = data.rows;
        preload_maps();
        spin();
      }) 
  })
}(window.jQuery)

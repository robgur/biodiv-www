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

      // var layerUrl = 'http://biota.cartodb.com/api/v1/viz/22972/viz.json';
      // cartodb.createLayer(map, layerUrl, {interactivity: null, infowindows: false}, function(layer,ee) {
      //   map.addLayer(layer);
      //   console.log(layer);
      //   console.log(ee);
      // });


    var carousel = new Array();
    var layers = new Array();
    var sql = new cartodb.SQL({ user: carousel_options.domain});
    var stop_carousel = false;
    var click_carousel = false;
    var current_stop = -1;
    var current_map_layer;
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
        } else {
          var options = {};
          if (carousel[current_stop].sql != null){
            options.query = carousel[current_stop].sql;
          }
          cartodb.createLayer(map, carousel[current_stop].cartodb_url, options, function(layer) {
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

        // var h = ;
        // console.log(h)
        // if (h < ){
        //   console.log('h')
        //   $("#hero-image img").css({'padding-top': '50px'});
        // }
        // $("#hero-image").css({
        //   'background': 'url('+carousel[current_stop].identifier+') no-repeat center center fixed',
        //   '-webkit-background-size': 'cover',
        //   '-moz-background-size': 'cover',
        //   '-o-background-size': 'cover',
        //   'background-size': 'cover'
        // });

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
        setTimeout(spin, 6000);
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
          } 
        }
        carousel = data.rows;
        spin();
      }) 
  })
}(window.jQuery)

var BOSH_SERVICE = 'http://192.168.0.101:7070/http-bind/';
var conn = null;

var selectedFriend=null;

var logoutClicked=false;

var notificationOpen=false;

////////////////////////////////////////////////////////////////////////////////////
$(document).ready(function () {



  if($(window).width() < 1024){

  $.Velocity.mock = true;

  $(function() {

    jQuery.fx.off = true;

  });

  }


  $(document).on('click','#user-notification-ic', function(e){

    e.preventDefault();
    e.stopPropagation();    

    console.log(e.target); 

    if($('#user-notification-ic').hasClass('notification-new'))
    {
      $('#user-notification-ic').removeClass('notification-new')
      $('#user-notification-ic').addClass('notification')
    } 

    if(!notificationOpen)
    {
      notificationOpen=true;

      vfxAnimShowNotification();
      
    }
    else
    {

     vfxAnimHideNotification();

     notificationOpen=false;

   }

 });


  $(document).on('click', '#friend-list-view li', function(e){

    e.preventDefault();
    e.stopPropagation();    

    console.log(e.target);    

    if(selectedFriend!=this.id)
    {

      if($('#'+selectedFriend).hasClass('single-friend-selected'))
      {
        $('#'+selectedFriend).removeClass('single-friend-selected');
      }

      selectedFriend=this.id;
      $('#'+selectedFriend).addClass('single-friend-selected');

      document.getElementById("lbl-friend-name").innerHTML = selectedFriend;

      document.getElementById("friend-profile-pic-ic").style.display = "block";

      $divs=$('#friend-profile-pic-ic, #lbl-friend-name');

      $divs.velocity('transition.slideRightIn',{

        duration: 500


      });

    }



    //alert(friendListMap[selectedFriend].friendJid);

  });

  console.log("document ready");

  vfxAnimInitial();

  console.log("created new strophe connection");	

  conn = new Strophe.Connection(BOSH_SERVICE);  

});


//////////////////////////////////////////////////////////////////////////////////////
function login()
{

	console.log("loging in");
	
	var userName=document.getElementById("userName").value+"@acer106/web";
	var password=document.getElementById("password").value;
	
	if(userName!=""&&password!="")
	{
    $("#btn-login").addClass("disabled");
    conn.connect(userName,password,onConnect);
  }
  else
  {
		//alert("enter user name and password");
		vfxAnimMissingCredentials();
	}
	
	
	
}

////////////////////////////////////////////////////////////////////////////////////

function onConnect(status)
{
	//playSound();
  if (status == Strophe.Status.CONNECTING) {
  	console.log('Strophe is connecting.');
  } else if (status == Strophe.Status.CONNFAIL) {
   console.log('Strophe failed to connect.');
 } else if (status == Strophe.Status.DISCONNECTING) {
   console.log('Strophe is disconnecting.');
 } else if (status == Strophe.Status.DISCONNECTED) {
   console.log('Strophe is disconnected.');

   if($("#btn-login").hasClass('disabled'))
   {
    $("#btn-login").removeClass("disabled");
  }

  if(logoutClicked==true)
  {
    toggleOptionsMenu();
    vfxAnimLogout();

    setTimeout(function(){
      window.location.reload();
    }, 1500);

  }
  else
  {
    $("#my-map-wrapper").addClass("disconnected");
  }


} else if (status == Strophe.Status.CONNECTED) {
 console.log('Strophe is connected.');

 XMPP.connection=conn;

 vfxAnimConnected();

 console.log("adding incomming msg handler");

 conn.addHandler(notifyUser, null, 'message', null, null,  null);  


 console.log(XMPP.connection.jid);

 var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
 XMPP.connection.sendIQ(iq, XMPP.on_roster);


 setTimeout(loadScript, 1000);

}
}

///////////////////////////////////////////////////////////////////////////////////

function notifyUser(msg) 
{
	
	console.log("msg incomming");
	
	console.log(msg);
	
  if (msg.getAttribute('from') === selectedFriend+"@acer106/phone") {

    var elems=msg.getElementsByTagName('body');
    
    var body=elems[0];
    
    var latLng=Strophe.getText(body);
    
    var str_array = latLng.split(',');
    console.log(str_array[0]);
    console.log(str_array[1]);
    
    //placeMarker(str_array[0],str_array[1]);


    marker = new google.maps.Marker({
    position: new google.maps.LatLng(str_array[0],str_array[1]), 
    map: map
    });


    animateMarker(marker, [str_array[0], str_array[1]], 100);

  }
  
  return true;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var map, marker;
var markersArray=[];
//var startPos = [23.027425, 72.511649];
var speed = 200; // km/h

var delay = 50;
// If you set the delay below 1000ms and you go to another tab,
// the setTimeout function will wait to be the active tab again
// before running the code.
// See documentation :
// https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout#Inactive_tabs

//var coords=[23.029400, 72.510877];

function animateMarker(marker, coords, km_h)
{
  var km_h = km_h || 50;

  function goToPoint()
  {
    var lat = marker.position.lat();
    var lng = marker.position.lng();
    var step = (km_h * 1000 * delay) / 3600000; // in meters
    
    var dest = new google.maps.LatLng(coords[0], coords[1]);
    
    var distance = google.maps.geometry.spherical.computeDistanceBetween(dest, marker.position); // in meters
    
    var numStep = distance / step;
    var i = 0;
    var deltaLat = (coords[0] - lat) / numStep;
    var deltaLng = (coords[1] - lng) / numStep;
    
    function moveMarker()
    {
      lat += deltaLat;
      lng += deltaLng;
      i += step;
      
      if (i < distance)
      {
        marker.setPosition(new google.maps.LatLng(lat, lng));
        map.setCenter(new google.maps.LatLng(lat,lng));
        setTimeout(moveMarker, delay);
      }
    }
    moveMarker();
  }
  goToPoint();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function loadScript() {

  document.getElementById('login-page').style.display="none";
  document.getElementById("my-map-wrapper").style.display="block";
  

  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://maps.googleapis.com/maps/api/js?libraries=geometry,places&key=AIzaSyAD8_7jlz6p87RMRfkFI-E-uvoIF6Qb2SE&callback=initialize';
  document.body.appendChild(script);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function initialize()
{

  document.getElementById("pac-input").style.display="block";


  var myOptions = {
    zoom: 16,
    center: new google.maps.LatLng(23.027425, 72.511649),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
  
  marker = new google.maps.Marker({
    position: new google.maps.LatLng(23.027425, 72.511649),

    map: map
  });
  
  google.maps.event.addListenerOnce(map, 'idle', function()
  {

    vfxAnimTopBar();
    document.getElementById("lbl-username").innerHTML = XMPP.jid_to_id(XMPP.connection.jid);
    
    
  });
  
  
  var input = document.getElementById('pac-input');
  var searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });
  
  
  
  
  var markers = [];
  // [START region_getplaces]
  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();

    if (places.length == 0) {
      return;
    }

    // Clear out the old markers.
    markers.forEach(function(marker) {
      marker.setMap(null);
    });
    
    
    markers = [];

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(place) {
      var icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };

      // Create a marker for each place.
      markers.push(new google.maps.Marker({
        map: map,
        icon: icon,
        title: place.name,
        position: place.geometry.location
      }));

      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    map.fitBounds(bounds);
  });



}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function placeMarker(lat,lng) {

  marker = new google.maps.Marker({
    position: new google.maps.LatLng(lat,lng), 
    map: map
  });

            // add marker in markers array
            markersArray.push(marker);

            map.setCenter(new google.maps.LatLng(lat,lng));
          }

///////////////////////////////////////////////////////////////////////////


function showAbout()
{
  vfxAnimShowAboutBox();

  setTimeout(vfxAnimHideAboutBox, 8000);
}

///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////


function toggleOptionsMenu()
{

  if($('#options-menu-dropdown').hasClass('options-menu-dropdown-show'))
  {
    vfxAnimHideOptionsMenu();
  }
  else
  {
    vfxAnimShowOptionsMenu();
  }

  $('#options-menu-dropdown').toggleClass("options-menu-dropdown-show options-menu-dropdown-hide");
  
}

///////////////////////////////////////////////////////////////////////////








var userData=
{


  friendRequest:[]


};





var friendListMap={};












//////////////////////////////////////////////////////////////////////////////////




var XMPP={

  connection:null,

  pending_subscriber: null,

  acceptRequest: function(jid){

    XMPP.connection.send($pres({
      to: jid+"@acer106",
      "type": "subscribed"}));

    XMPP.connection.send($pres({
      to: jid+"@acer106",
      "type": "subscribe"}));

    $('#request-' + jid).remove();

  },

  rejectRequest: function(jid){

    XMPP.connection.send($pres({
      to: jid+"@acer106",
      "type": "unsubscribed"}));

    $('#request-' + jid).remove();

  },

  disconnect: function(){

    logoutClicked=true;

    XMPP.connection.disconnect();
    XMPP.connection=null;

  },

  jid_to_id: function (jid) {
    return Strophe.getBareJidFromJid(jid).replace("@acer106","");
  },



  on_roster: function (iq) {
    $(iq).find('item').each(function () {
      var jid = $(this).attr('jid');
      var name = $(this).attr('name') || jid;

            // transform jid into an id
            var jid_filtered = XMPP.jid_to_id(jid);

            var friend = $("<li id='"+jid_filtered+"' class='single-friend'>"+

              "<img class='friend-profile-pic' src='img/user.png'></img>"+
              "<h2 class='friend-name'>"+jid_filtered+"</h2>"+
              "<div class='friend-status-ic offline'></img>"+

              "</li>");

            XMPP.insert_contact(friend);

            friendListMap[jid_filtered]={  friendJid:jid };

            console.log(jid_filtered);

          });


    XMPP.connection.addHandler(XMPP.on_presence, null, "presence");
    XMPP.connection.send($pres());

  },

  on_roster_changed: function (iq) {
    $(iq).find('item').each(function () {
      var sub = $(this).attr('subscription');
      var jid = $(this).attr('jid');
      var name = $(this).attr('name') || jid;
      var jid_filtered = XMPP.jid_to_id(jid);

      if (sub === 'remove') {
                // contact is being removed
                $('#' + jid_filtered).remove();
              } else {
                // contact is being added or modified

                console.log("roster changed");

                var friend_html = "<li id='"+jid_filtered+"' class='single-friend'>"+

                "<img class='friend-profile-pic' src='img/user.png'></img>"+
                "<h2 class='friend-name'>"+jid_filtered+"</h2>"+
                "<div class='friend-status-ic "+($('#' + jid_filtered).attr('class') || "offline")+"'></img>"+
                "</li>";

                if ($('#' + jid_filtered).length > 0) {
                  $('#' + jid_filtered).replaceWith(friend_html);
                } else {
                  XMPP.insert_contact($(friend_html));
                }
              }
            });

return true;
},









presence_value: function (elem) {
  if (elem.hasClass('online')) {
    return 2;
  } else if (elem.hasClass('away')) {
    return 1;
  }

  return 0;
},

insert_request: function (elem) {
  var jid = elem.find('.friend-name').text();
  var pres = XMPP.presence_value(elem.find('.friend-status-ic'));
  var contacts = $('#friend-list-view-wrapper li');
  if (contacts.length > 0) {
    var inserted = false;
    contacts.each(function () {
      var cmp_pres = XMPP.presence_value(
        $(this).find('.friend-status-ic'));
      var cmp_jid = $(this).find('.friend-name').text();

      if (pres > cmp_pres) {
        $(this).before(elem);
        inserted = true;
        return false;
      } else if (pres === cmp_pres) {
        if (jid < cmp_jid) {
          $(this).before(elem);
          inserted = true;
          return false;
        }
      }
    });
    if (!inserted) {
      $('#friend-list-view-wrapper ul').append(elem);
    }
  } else {
    $('#friend-list-view-wrapper ul').append(elem);
  }
},

insert_contact: function (elem) {
  var jid = elem.find('.friend-name').text();
  var pres = XMPP.presence_value(elem.find('.friend-status-ic'));
  var contacts = $('#friend-list-view-wrapper li');
  if (contacts.length > 0) {
    var inserted = false;
    contacts.each(function () {
      var cmp_pres = XMPP.presence_value(
        $(this).find('.friend-status-ic'));
      var cmp_jid = $(this).find('.friend-name').text();

      if (pres > cmp_pres) {
        $(this).before(elem);
        inserted = true;
        return false;
      } else if (pres === cmp_pres) {
        if (jid < cmp_jid) {
          $(this).before(elem);
          inserted = true;
          return false;
        }
      }
    });
    if (!inserted) {
      $('#friend-list-view-wrapper ul').append(elem);
    }
  } else {
    $('#friend-list-view-wrapper ul').append(elem);
  }
},



on_presence: function (presence) {
  var ptype = $(presence).attr('type');
  var from = $(presence).attr('from');
  var jid_filtered = XMPP.jid_to_id(from);

  console.log('presence from: '+from+' type: '+ptype);

  try {
    friendListMap[jid_filtered].friendJid=from;
  }
  catch(err) {
    console.log(err.message);
  }


  if (ptype === 'subscribe') {
            // populate pending_subscriber, the approve-jid span, and
            // open the dialog
            //Gab.pending_subscriber = from;
            //$('#approve-jid').text(Strophe.getBareJidFromJid(from));
            //$('#approve_dialog').dialog('open');

            console.log("subscribe request from "+Strophe.getBareJidFromJid(from));

            userData.friendRequest.push(jid_filtered);
            if($('#user-notification-ic').hasClass('notification'))
            {
              $('#user-notification-ic').removeClass('notification')
              $('#user-notification-ic').addClass('notification-new')
            }

            var request="<li id='request-"+jid_filtered+"' class='single-request'>"+

            "<p>Friend request from "+jid_filtered+"</p>"+

            "<button id='btn-accept' style='font-size: 12px;float: right;height: 28px;'"+

            "class='btn btn-success' onClick=\"XMPP.acceptRequest('"+jid_filtered+"');\" type='submit' aria-hidden='true'><span class='glyphicon glyphicon-ok'></span>&nbsp;Accept</button>"+

            "<button id='btn-reject' style='font-size: 12px;float: right;margin-right: 15px;height: 28px;'"+

            "class='btn btn-danger' onClick=\"XMPP.rejectRequest('"+jid_filtered+"');\" type='submit' aria-hidden='true'><span class='glyphicon glyphicon-remove'></span>&nbsp;Reject</button>"+

            "</li>";

            $('#request-list-view-wrapper ul').append(request);



          } else if (ptype !== 'error') {
            var contact = $('#side-bar li#' + jid_filtered + ' .friend-status-ic')
            .removeClass("online")
            .removeClass("offline");
            if (ptype === 'unavailable') {
              contact.addClass("offline");
            } else {
              var show = $(presence).find("show").text();
              if (show === "" || show === "chat") {
                contact.addClass("online");
              } else {
                contact.addClass("offline");
              }
            }

            var li = contact.parent();
            li.remove();
            XMPP.insert_contact(li);
          }

        // reset addressing for user since their presence changed
        //var jid_filtered = XMPP.jid_to_id(from);
        //$('#chat-' + jid_filtered).data('jid', Strophe.getBareJidFromJid(from));

        return true;
      },





    }









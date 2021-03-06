(function($, doc) {
	var _app,
    	_mapElem,
    	_private,
        _mapObj,
        _address,
        _mese,
        _citta,
        _provincia,
        _networkState;
    
	//Private methods
	_private = {		
		initMap: function(address) {
			
			var myOptions,
                geocoder = new google.maps.Geocoder();    
            
            
            geocoder.geocode({'address': address}, function(results, status) {
                
              if (status == google.maps.GeocoderStatus.OK) {  
                  
                myOptions = {
    				zoom: 16,
                    center: results[0].geometry.location,
    				mapTypeControl: false,
                    streetViewControl: false,
                    //navigationControlOptions: { style: google.maps.NavigationControlStyle.SMALL },
    				mapTypeId: google.maps.MapTypeId.ROADMAP
    			};
            
                _mapObj = new google.maps.Map(_mapElem, myOptions);
                
                new google.maps.Marker({
                    map: _mapObj,
                    position: results[0].geometry.location,
                    //animation:google.maps.Animation.DROP
                });
                  
                //google.maps.event.trigger(_mapObj, "resize");
                  
                
              } 
            }); 
            
		},
        
        getData:function(dataSource, url){            
            $.ajax({ 
                url: url,
                type: "POST",
                dataType: "json",
                success: function(response) {
                    //store response
                    localStorage.setItem(dataSource, JSON.stringify(response));
                }
            });
        },
        initData:function(){
            $.ajax({ 
                url: 'http://wih.alwaysdata.net/cegliestate/datastore/cegliestate.json',
                type: "POST",
                dataType: "json",
                success: function(response) {
                    //store response
                    localStorage.setItem('app', JSON.stringify(response));
                    
                    _private.initMesi();
                }
            });
        },
        
        initMesi:function(){
            
            var cashedData = localStorage.getItem('app'),
                jsondata;
            
            var dataSource = new kendo.data.DataSource({
                transport: {
                    read: function(operation) {  
                        operation.success(JSON.parse(cashedData));
                    }
                 },
                 schema: { // describe the result format
                     data: "mesi" 
                 }
            });
        
                        
            $("#mesi-listview").kendoMobileListView({
                 dataSource: dataSource,
                 template: $("#mesi-template").text(),
            });
            
            $("#mesi-listview").kendoMobileListView({
                dataSource: dataSource,
                template: $("#mesi-template").text(),
            });
            
            
            jsondata = JSON.parse(cashedData);
            
            _citta = jsondata.citta;
            _provincia = jsondata.provincia;
            
            //Set title
            $('#home').find("[data-role=view-title]").text(jsondata.nome);
            
            $.each(jsondata.mesi, function(key, value){
                _private.getData(value.id, value.dataUrl);
            });
            
            //Update day event
            _private.getDayEvent();
            
            
            $("#input_search_word").bind("click", function(){
                _private.clearSearchList();
            });
            $("#input_search_word").bind("keydown", function(){
                _private.clearSearchList();
            });
        },
        
        getDayEvent: function(){
            var now = new Date(),
    			d = now.getMonth()+1,
					dN = null,
                    days = ["LUNEDI", "MARTEDI","MERCOLEDI","GIOVEDI", "VENERDI","SABATO","DOMENICA"],
                    ds = [{tot_e:0}];
               
           
					
        	if(d == 1)dN = 'gennaio';
        	else if(d == 2)dN = 'febbraio';
        	else if(d == 3)dN = 'marzo';
        	else if(d == 4)dN = 'aprile';
            else if(d == 5)dN = 'maggio';
            else if(d == 6)dN = 'giugno';
            else if(d == 7)dN = 'luglio';
            else if(d == 8)dN = 'agosto';
            else if(d == 9)dN = 'settembre';
            else if(d == 10)dN = 'ottobre';
            else if(d == 11)dN = 'novembre';
            else if(d == 12)dN = 'dicembre';
            
            
            var cashedData = localStorage.getItem(d);
    		
            
    		 if(cashedData != null || cashedData != undefined) {
                
                var query = days[now.getDay()-1] + " " + now.getDate() + " " + dN.toUpperCase(),
              
                    dataSource = new kendo.data.DataSource({
                        transport: {
                            read: function(operation) {                            
                                var cashedData = localStorage.getItem(d);
                                operation.success(JSON.parse(cashedData));            
                            }
                        },
                        schema: { // describe the result format
                            data: "eventi" 
                        }
                    });
                
                dataSource.filter({
                    field: "data",
                    operator: "eq",
                    value: query.trim()
                });
                
                
                localStorage.setItem('days', '{"eventi":' +  String(JSON.stringify(dataSource.view()) + '}'));  
                 
                
                var dData = localStorage.getItem('days'),             
                    len = dataSource.view().length,
                    jsondata = JSON.parse(dData);
                  
                ds = [{tot_e:len}];
                
                if(len === 1) ds = [{tot_e:len, nome:jsondata.eventi[0].nome, data:jsondata.eventi[0].data, ora:jsondata.eventi[0].ora, descrizione:jsondata.eventi[0].descrizione, indirizzo: jsondata.eventi[0].indirizzo}];
                
                
            }
            
            $("#day-listview").kendoMobileListView({
                        dataSource: ds,
                        template: $("#evento-day-template").text(),
                    });
        },
        
        clearSearchList:function(){
            
            if($("#input_search_word").val().length <=1){
                 var dataSource = new kendo.data.DataSource({
                        transport: {
                            read: function(operation) {         
                                var cashedData = localStorage.getItem(_mese);
                                operation.success(JSON.parse(cashedData));             
                            }
                        },
                        schema: { // describe the result format
                            data: "eventi" 
                        }
                    });
        
                        
                    $("#flat-listview").kendoMobileListView({
                        dataSource: dataSource,
                        template: $("#eventi-template").text(),
                    });
            }
        }
        
	};
    
	_app = {
        
        
        initApp:function(force){
            
            _networkState = navigator.network.connection.type;
            
            
            document.addEventListener("backbutton", function(){}, false); 
            
            
            var cashedData = localStorage.getItem('app');
                         
            if( cashedData == null || cashedData == undefined) {
                
                //controllo se connesso
                if(_networkState != 'none'){                    
                    //Aggiorno data-source  
                    _private.initData();
                }else{
                    alert('Impossibile accedere ai dati. Connessione Assente');
                   
                    navigator.app.exitApp();
                }
                
            }else{
                 _private.initMesi();
            }
        },
        
		locationEventShow: function() {
            _mapElem = document.getElementById("map");			
            _private.initMap(_address);
		},
        
        showEventList: function(e){
            
            _mese = e.view.params.mese;
            
            var dataSource = new kendo.data.DataSource({
                transport: {
                    read: function(operation) {         
                        var cashedData = localStorage.getItem(e.view.params.mese);
                        operation.success(JSON.parse(cashedData));             
                    }
                },
                schema: { // describe the result format
                    data: "eventi" 
                }
            });

                
            $("#flat-listview").kendoMobileListView({
                dataSource: dataSource,
                template: $("#eventi-template").text(),
            });
                
            e.view.element
                .find("[data-role=view-title]")
                .text( "Eventi di " + e.view.params.nome_mese);
        },
        
        showEventDetails: function(e){
            var dataSource = [{nome:e.view.params.nome, data:e.view.params.data, ora: e.view.params.ora, descrizione:e.view.params.descrizione, tipo:e.view.params.tipo}];
                
                $("#flat-details-listview").kendoMobileListView({
                    dataSource: dataSource,
                    template: $("#evento-details-template").text(),
                });
            _address = e.view.params.address + ", " + _citta + ", " + _provincia;
           
        },
        
        facebookAction: function(e){
            console.log($('#flat-details-listview li p.item-info-det').html());
            // Perform the protected OAuth calls.
            $.oajax({
                type: "POST",
                url: "https://graph.facebook.com/me/feed",
                jso_provider: "facebook",
                jso_scopes: ["read_stream", "publish_stream"],
                jso_allowia: true,
                dataType: 'json',
                data: {
                    message: $('#flat-details-listview li h2.item-title-det').html() + "\n" +
                        $('#flat-details-listview li p.item-info-det').html()+ "\n" + 
                        $('#flat-details-listview li p.item-desc-det').html(),
                    //link: "http://icenium.com/?utm_source=facebook&utm_medium=post&utm_campaign=sampleapp",
                   //picture:'http://wih.alwaysdata.net/cegliestate/icon.png'
                },
                success: function(data) {
                    console.log("Post response (facebook):");
                    console.log(data);
                },
                error: function(e) {
                    console.log(e);
                }
            });
            
            
        },
        
        searchAction: function(e){
            
            var query = $('#input_search_word').val(); 
            
            
            
            if(query.length < 3) return;
            
            
            var dataSource = new kendo.data.DataSource({
                    transport: {
                        read: function(operation) {                            
                            var cashedData = localStorage.getItem(_mese);
                            operation.success(JSON.parse(cashedData));            
                        }
                    },
                    schema: { // describe the result format
                        data: "eventi" 
                    }
                });
                                
                dataSource.filter({
                    field: "descrizione",
                    operator: function(item, value){                        
                        if( (item.toLowerCase().indexOf(value.toLowerCase()) >= 0) ) return true;
                        else return false;
                    },
                    value: "'" + query +"'"
                });
            
             
            
                $("#flat-listview").kendoMobileListView({
                    dataSource: dataSource.view(),
                    template: $("#eventi-template").text()
                });
        },
        searchShow:function(e){
            
            var searchDiv = $('.search-header'),
                searchButton = $('#searchButton');
            
            if ( searchButton.text() == 'Annulla') {
                resetSearch();  
            }else{
                searchButton.text('Annulla');
                kendo.fx($(searchDiv)).expand("vertical").stop().play();
            }
          
        },
        
        resetSearch:function(){
            var searchDiv = $('.search-header'),
                searchButton = $('#searchButton'),
                inputSearch = $('#input_search_word');
            
           
            searchButton.text('');   
            var sp = $('<span class="km-icon km-search km-notext">');
            searchButton.append(sp);
            kendo.fx(searchDiv).expand("vertical").stop().reverse();
            inputSearch.val('');
            _private.clearSearchList();
        },
        
        deviceReady: function(){
      
            _app.initApp(false);
            
           
            
            var debug = true;
            
             // Use ChildBrowser instead of redirecting the main page.
            jso_registerRedirectHandler(window.plugins.childBrowser.showWebPage);
            
            
            /*
             * Register a handler on the childbrowser that detects redirects and
             * lets JSO to detect incomming OAuth responses and deal with the content.
             */

            window.plugins.childBrowser.onLocationChange = function(url){
                url = decodeURIComponent(url);
                console.log("Checking location: " + url);
                jso_checkfortoken('facebook', url, function() {
                    console.log("Closing child browser, because a valid response was detected.");
                    window.plugins.childBrowser.close();
                });
            };
           
            
            /*
             * Configure the OAuth providers to use.
             */
			jso_configure({
				"facebook": {
                    client_id: '491900134205827',
					redirect_uri: "http://www.facebook.com/connect/login_success.html",
					authorization: "https://www.facebook.com/dialog/oauth",
					presenttoken: "qs"
				}
			}, {"debug": debug});
            
            
            
        },
        
        refreshData:function(){            
                
            //controllo se connesso
            /*if(_networkState != 'none'){             
                _app.initApp(true);
            }else{
                alert('Impossibile accedere ai dati. Connessione Assente');
                return;
            }*/
        }
	};
    
       
	$.extend(window, {
        showEventDetails: _app.showEventDetails,
        showEventList: _app.showEventList,
        locationEventShow:_app.locationEventShow,
        facebookAction: _app.facebookAction,
        searchAction: _app.searchAction,
        searchShow:_app.searchShow,
        deviceReady:_app.deviceReady,
        refreshData:_app.refreshData,
        resetSearch:_app.resetSearch
	});
}(jQuery, document));

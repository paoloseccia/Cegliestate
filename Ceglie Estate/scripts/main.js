(function($, doc) {
	var _app,
    	_mapElem,
    	_private,
        _mapObj,
        _address;
    
	//Private methods
	_private = {		
		initMap: function(address) {
			
			var myOptions,
                geocoder = new google.maps.Geocoder();  
            
            
            
            geocoder.geocode( { 'address': address}, function(results, status) {
                
              if (status == google.maps.GeocoderStatus.OK) {  
                  
                myOptions = {
    				zoom: 16,
                    center: results[0].geometry.location,
    				mapTypeControl: false,
                    streetViewControl: false,
    				navigationControlOptions: { style: google.maps.NavigationControlStyle.SMALL },
    				mapTypeId: google.maps.MapTypeId.ROADMAP
    			};
            
                _mapObj = new google.maps.Map(_mapElem, myOptions);
                
                new google.maps.Marker({
                    map: _mapObj,
                    position: results[0].geometry.location,
                    //animation:google.maps.Animation.DROP
                });
                  
                google.maps.event.trigger(_mapObj, "resize");
                  
                
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
        
        getDayEvent: function(){
            var now = new Date(),
    			d = now.getMonth(),
					dN = null,
                    days = ["LUNEDI", "MARTEDI","MERCOLEDI","GIOVEDI", "VENERDI","SABATO","DOMENICA"],
                    ds = [{tot_e:0}];
               
           
					
        	if(d == 5)dN = 'giugno';
        	else if(d == 6)dN = 'luglio';
        	else if(d == 7)dN = 'agosto';
        	else if(d == 8)dN = 'settembre';
    		
            
    		if(dN != null){
                
                var query = days[now.getDay()-1] + " " + now.getDate() + " " + dN.toUpperCase();
               
                var dataSource = new kendo.data.DataSource({
                    transport: {
                        read: function(operation) {                            
                            var cashedData = localStorage.getItem(dN);
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
                
                var cashedData = localStorage.getItem('days'),             
                    len = dataSource.view().length,
                    jsondata = JSON.parse(cashedData);
                  
                ds = [{tot_e:len}];
                
                if(len === 1) ds = [{tot_e:len, nome:jsondata.eventi[0].nome, data:jsondata.eventi[0].data, ora:jsondata.eventi[0].ora, descrizione:jsondata.eventi[0].descrizione, indirizzo: jsondata.eventi[0].indirizzo}];
                
                
            }
            
            $("#day-listview").kendoMobileListView({
                        dataSource: ds,
                        template: $("#evento-day-template").text(),
                    });
        }
		
	};
    
	_app = {
        
        
        initApp:function(){
            
            //clear cache
            //localStorage.clear();
            
            //Update giugno
            _private.getData('giugno', 'http://wih.alwaysdata.net/cegliestate/datastore/cegliestate_giugno.json');
            
            //Update luglio
            _private.getData('luglio', 'http://wih.alwaysdata.net/cegliestate/datastore/cegliestate_luglio.json');
            
            //Update agosto
            _private.getData('agosto', 'http://wih.alwaysdata.net/cegliestate/datastore/cegliestate_agosto.json');
            
            //Update settembre
            _private.getData('settembre', 'http://wih.alwaysdata.net/cegliestate/datastore/cegliestate_settembre.json');
            
            //Update day event
            _private.getDayEvent();
            
        },
        
		locationEventShow: function() {
            _mapElem = document.getElementById("map");			
            _private.initMap(_address);
		},
        
        showEventList: function(e){
            
            var dataSource = new kendo.data.DataSource({
                transport: {
                    read: function(operation) {                        
                        
                        var cashedData = localStorage.getItem(e.view.params.mese);
                         
                        if(cashedData != null || cashedData != undefined) {
                            //if local data exists load from it
                            operation.success(JSON.parse(cashedData));
                        } else {
                          
                            $.ajax({ //using jsfiddle's echo service to simulate remote data loading
                                url: "http://wih.alwaysdata.net/cegliestate/datastore/cegliestate_"+e.view.params.mese+".json",
                                type: "POST",
                                dataType: "json",
                                success: function(response) {                                   
                                    //store response
                                    
                                    console.log(response);
                                    localStorage.setItem(e.view.params.mese, JSON.stringify(response));
                                    //pass the pass response to the DataSource
                                    operation.success(response);
                                }
                            });
                        }                 
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
                .text( "Eventi di " + e.view.params.mese);
        },
        
        showEventDetails: function(e){
            var dataSource = [{nome:e.view.params.nome, data:e.view.params.data, ora: e.view.params.ora, descrizione:e.view.params.descrizione}];
                
                $("#flat-details-listview").kendoMobileListView({
                    dataSource: dataSource,
                    template: $("#evento-details-template").text(),
                });
            _address = e.view.params.address;           
        }
	};
    
       
	$.extend(window, {
        showEventDetails: _app.showEventDetails,
        showEventList: _app.showEventList,
        initApp: _app.initApp,
        locationEventShow:_app.locationEventShow
	});
}(jQuery, document));
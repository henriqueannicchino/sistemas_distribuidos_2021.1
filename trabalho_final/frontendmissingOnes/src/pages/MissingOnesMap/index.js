import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'; 

import mapboxgl from "mapbox-gl";

import './index.css';

import Header from '../../components/Header';

let _id = [], missingName = [], missingDay = [], image = [], longitude = [], latitude = [];
let DATA = ``, missingOneVet = [], features;

const MapboxGLMap = (props) => {
    const [map, setMap] = useState(null);
    const mapContainer = useRef(null);
    var [state, setState] = useState({
		lng: -60.67312, lat: 2.83070, zoom: 6.00
    });
    var [registros, setRegistros] = useState({
		MissingOnes: []
	});
	
	const [usuario, setUsuario] = useState();
	const URL = 'http://localhost:5000';
		
	//Esse useEffect vai ser somente para recupar os dados do back
	useEffect(() => {
		//console.log('Entrou aqui, vai pegar dados do back')
		
		async function LoadData() {
			setRegistros({MissingOnes: []});
			_id = []; missingName = []; missingDay = []; image = []; longitude = []; latitude = [];
			//console.log('Inicio da função para pegar os dados do back')
			let response = await axios.get(`${URL}/MissingOnes`)
				.then(res => {
					//console.log('Back retornou uma resposta')
					console.log(res.data);
					return res.data;
				})
				.catch(function (error) {
					console.log(error);
				})
			//console.log('Organizando as respostas do back nas variaveis')
			//console.log('RESPOSTA -> ', response)
			setRegistros(response);
		}
		LoadData()
	}, [])
	
	//Vai preparar os dados
	useEffect(() => {
		async function PrepararDados() {
			await registros.MissingOnes.map((registro) => {
				_id.push(registro._id);
				missingName.push(registro.missingName);
				missingDay.push(registro.missingDay);
				image.push(registro.image);
				longitude.push(registro.longitude);
				latitude.push(registro.latitude);
				return;
			})
		}
        
    if (registros) {
			PrepararDados();
		} else {
			return;
		}
	}, [registros])


    useEffect(() => {
        async function PrepararEstacoes() {
			var JsonMissingOne = ``;
           
			DATA += `{"type": "FeatureCollection", "features": [ `; 
			
			var cont=0;
			while(cont<missingName.length){
				JsonMissingOne += `{"type":"Feature","properties":{"id": "${_id[cont]}","description":"<strong>${missingName[cont]}</strong><p>Desaparecido(a) desde: ${missingDay[cont]}`;
				JsonMissingOne += `<br> longitude: ${longitude[cont]} <br> latitude: ${latitude[cont]} </p>"},`
				JsonMissingOne += `"geometry":{"type":"Point","coordinates":[${longitude[cont]}, ${latitude[cont]}]},"id":"${_id[cont]}"}`;                                                                                                                             
            
				cont++;
				if(cont<missingName.length)
					DATA += JsonMissingOne+`,`;
				else
					DATA += JsonMissingOne+`]}`;
						
				JsonMissingOne = JSON.parse(JsonMissingOne);
				missingOneVet.push(JsonMissingOne);
				JsonMissingOne = ``;
			}
					
			DATA = JSON.parse(DATA);
					
			initializeMap({ mapContainer });            
        }  

        //mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;
        mapboxgl.accessToken = ' '
        const initializeMap = ({ mapContainer }) => {
            const map = new mapboxgl.Map({
                container: mapContainer.current,
                style: "mapbox://styles/mapbox/streets-v11", // stylesheet location
                center: [-60.67312, 2.83070],
                zoom: 1.00
            });
  
            map.on("load", () => {
                setMap(map);
                map.resize();
            });

            map.on('move', () => {
                setState({
                    lng: map.getCenter().lng.toFixed(5),
                    lat: map.getCenter().lat.toFixed(5),
                    zoom: map.getZoom().toFixed(2)
                });
            });

            let popup = new mapboxgl.Popup({
                closeButton: true
            });
            
            function normalize(string) {
                return string.toUpperCase();
            }

            function getUniqueFeatures(array, comparatorProperty) {
                var existingFeatureKeys = {};
                // Because features come from tiled vector data, feature geometries may be split
                // or duplicated across tile boundaries and, as a result, features may appear
                // multiple times in query results.
                var uniqueFeatures = array.filter(function(el) {
                    if (existingFeatureKeys[el.properties[comparatorProperty]]) {
                        return false;
                    } else {
                        existingFeatureKeys[el.properties[comparatorProperty]] = true;
                        return true;
                    }
                });
        
                return uniqueFeatures;
            }


            map.on('load', function() {
                map.addSource('mapMissingOnes', {
                    'type': 'geojson',
                    'data': DATA
                })

                map.addLayer({
                    'id': 'missingOne',
                    'type': 'circle',
                    'source': 'mapMissingOnes',
                    'layout': {
                        // make layer visible by default
                        'visibility': 'visible'
                    },
                    'paint': {
                        'circle-radius': 8,
                        'circle-color':  [
                            'case',
                            ['boolean', ['feature-state', 'click'], false],
                            '#888888',
                            '#fc0303'
                        ]
                    }
                })

                map.on('click', 'missingOne', function(e) {
                    var coordinates = e.features[0].geometry.coordinates.slice();
                    var description = e.features[0].properties.description;
                    
                    // Ensure that if the map is zoomed out such that multiple
                    // copies of the feature are visible, the popup appears
                    // over the copy being pointed to.
                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                    }
                    
                    popup
                    .setLngLat(coordinates)
                    .setHTML(description)
                    .addTo(map);

                });
								
                // Change the cursor to a pointer when the mouse is over the stations layer.
                map.on('mouseenter', 'missingOne', function() {
                    map.getCanvas().style.cursor = 'pointer';
                });
								
                    
                // Change it back to a pointer when it leaves.
                map.on('mouseleave', 'missingOne', function() {
                    map.getCanvas().style.cursor = '';
                });
                

                setTimeout(() => {
                    
					features = [];
					var cont=0;
					while(cont < missingOneVet.length){
						features.push(missingOneVet[cont]);
						
						cont++;
					}


                    if (features.length > 0) {
                        //var uniqueFeatures = getUniqueFeatures(featuresMenu, 'id');
                        
                        map.zoomTo(5.15, { duration: 3000 });
                        //loaded = 1;
                    }    
                }, 1000);
            });
						
			// enumerate ids of the layers
			var toggleableLayerIds = ['missingOne'];

			// set up the corresponding toggle button for each layer
			for (var i = 0; i < toggleableLayerIds.length; i++) {
				var id = toggleableLayerIds[i];

				var link = document.createElement('a');
				link.href = '#';
				link.className = 'active';
				link.textContent = id;

				link.onclick = function(e) {
					var clickedLayer = this.textContent;
					e.preventDefault();
					e.stopPropagation();
					
				};

			}
						
        };
  
        if (!map && registros.MissingOnes.length > 0)
            PrepararEstacoes()
        else {
			return;
		}
    }, [map, registros]);
	
	function renderData(Data, index) {
		if(Data.missingName !== undefined)
			return(
				<tr key={index}>
					<td>{index+1}</td>
					<td><img src={`data:image/jpeg;base64,${Data.image}`} alt="..." width="60"/></td>
					<td>{Data.missingName}</td>
					<td>{Data.missingDay}</td>
					<td>{Data.longitude+" "+Data.latitude}</td>
				</tr>
			)
	}
	
	/*{image[0]!==null ? 
		<div style={{width: "18rem"}}>
			<img src={`data:image/jpeg;base64,${image[0]}`} alt="..." width="300"/>
		</div>
		:
		<></>
	}*/
	
    return (
		<div>
            <Header title="MissingOnes" />
            
            <div style={{width:"100%", height:"85%", margin: "0 auto"}}>
                <div className='sidebarStyle'>
					<div>Longitude: {state.lng} | Latitude: {state.lat} | Zoom: {state.zoom}</div>
                </div>
                <div ref={el => (mapContainer.current = el)} className='mapContainer' />
            </div>
			
			<div style={{position: "absolute", width: "100%", top: "85%"}}>
				
				<table className="table">
					<thead>
						<tr>
							<th scope="col">item</th>
							
							<th scope="col">Foto</th>
							<th scope="col">Nome</th>
							<th scope="col">Data do desaparecimento</th>
							<th scope="col">Coordenadas do último local</th>
						</tr>
					</thead>
					<tbody>
						{registros.MissingOnes.map(renderData)}
						
					</tbody>
				</table>
			</div>
			
        </div>
    )
};
  
export default MapboxGLMap;



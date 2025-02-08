//var jsonUrl = 'diskominfo.json';
var dataCount = -1;
var dataJson;
var plnJson = [];
const groupId = getQueryParam('id') ?? 'all';
const plnUrl = getQueryParam('pln'); // dishub.kaltimprov.go.id
if (plnUrl) {
	var jsonUrl = 'https://i-see.iconpln.co.id/backend/api/View/embedlink?url=' + plnUrl;
} else {
	var jsonUrl = 'data/' + groupId + '.json';
}
const samagovUrl = 'https://backend.samagov.id/api/cctv/';
const diskominfoUrl = 'https://diskominfo.samarindakota.go.id/api/cctv/';
var isAskFullscreen = parseInt(getQueryParam('full') ?? 1, 10);
var modeIndex = parseInt(getQueryParam('mode') ?? 0, 10);
var imgIndex = parseInt(getQueryParam('from') ?? 0, 10);
var zoomIndex = parseInt(getQueryParam('zoom') ?? 1, 10);
var totalRows = parseInt(getQueryParam('row') ?? 0, 10);
var totalColumns = parseInt(getQueryParam('col') ?? 0, 10);
var totalCells = 0;
var fixCell = false;
if ((totalRows * totalColumns) > 0) {
	fixCell = true;
}

//console.log('row='+totalRows+'col='+totalColumns);
function getQueryParam(param) {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get(param);
}

function toggleFullscreen() {
	if (!document.fullscreenElement) {
		document.documentElement.requestFullscreen().catch(err => {
			alert(`Error attempting to enable full-screen mode: ${err.message}`);
		});
	} else {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		}
	}
}

function askFullscreen() {
	const menu = document.getElementById('menu');
	menu.style.display = 'none';
	const fullscreenPrompt = document.getElementById('fullscreen-prompt');
	fullscreenPrompt.style.display = 'block'; // Show the prompt
	document.getElementById('enter-fullscreen-btn').addEventListener('click', () => {
		document.documentElement.requestFullscreen().catch(err => {
			alert(`Error attempting to enable full-screen mode: ${err.message}`);
		});
		fullscreenPrompt.style.display = 'none'; // Hide the prompt
		menu.style.display = '';
		isAskFullscreen = 0;
		createGrid();
	});

	document.getElementById('dismiss-btn').addEventListener('click', () => {
		fullscreenPrompt.style.display = 'none'; // Hide the prompt if the user dismisses
		menu.style.display = '';
		isAskFullscreen = 0;
		createGrid();
	});
}

async function loadData() {
	//console.log('load data');
	try {
		const response = await fetch(jsonUrl);
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		dataJson = await response.json();
		if (dataJson.data) {
			if (dataJson.pln) {
				dataJson.pln.forEach(item => {
					//console.log(item.name);
					loadDataPln(item.name, item.url);
				})
			}
			dataJson = dataJson.data;
		}
		else if (dataJson.data && dataJson.data[0].areaTree && dataJson.data[0].areaTree[0].cameraTree) {
			dataJson = dataJson.data[0].areaTree[0].cameraTree;
		}
		dataCount = dataJson.length;
		createGridItem();
	} catch (error) {
		console.error('There has been a problem with your fetch operation:', error);
	}
}

function SetUrlAfterLoadDataPln(name) {
	if(modeIndex==0) {
		let imgs = document.querySelectorAll('.grid-item img');
		imgs.forEach(img => {
			//console.log('pause = '+video.src);
			if(img.dataset.pln) {
				var newTimestamp = new Date().getTime();
				var temp = getPlnUrl(img.dataset.pln,img.dataset.cameraId);
				temp = temp + '&tx=' + newTimestamp;
				temp = temp.replace('&format=fmp4&', '&format=jpeg&');
				img.src=temp;
			}
		});				
	} else {
		let videos = document.querySelectorAll('.grid-item video');
		videos.forEach(video => {
			//console.log('pause = '+video.src);
			if(video.dataset.pln) {
				video.src=getPlnUrl(video.dataset.pln,video.dataset.cameraId);
			}
			//video.pause();
		});						
	}	
}

async function loadDataPln(name, url) {
	//console.log('load data: '+name);
	try {
		urlPln = "https://i-see.iconpln.co.id/backend/api/View/embedlink?url=" + url;
		const response = await fetch(urlPln);
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		json = await response.json();
		if (json.data && json.data[0].areaTree && json.data[0].areaTree[0].cameraTree) {
			json = json.data[0].areaTree[0].cameraTree;
			plnJson[name] = json;
			SetUrlAfterLoadDataPln(name);
			//console.log('loadDataPln: '+name+' = '+json);
			//console.log(name+': '+plnJson[name]);
		}
		//console.log(plnJson);
	} catch (error) {
		console.error('There has been a problem with your fetch operation:', error);
	}
}

function getPlnUrl(plnName, cameraId) {
    //console.log('getPlnUrl: ' + plnName + ' / ' + cameraId);
	if(plnJson[plnName]) {
		for (let item of plnJson[plnName]) {
			//console.log('item: ' + item.cameraId);
			if (item.cameraId == cameraId) {
				//console.log('item found: ' + item.streamingURL);
				return item.streamingURL;
			}
		}
	}
    //console.log('item not found: ' + cameraId);
    return null;
}

function SetNotAvailable(aparent) {
	const fallbackText = document.createElement('div');
	fallbackText.style.color = 'white';
	fallbackText.style.backgroundColor = 'black';
	fallbackText.style.textAlign = 'center';
	fallbackText.style.height = '100%';
	fallbackText.style.display = 'flex';
	fallbackText.style.justifyContent = 'center';
	fallbackText.style.alignItems = 'center';
	fallbackText.innerHTML = aparent.dataset.title + '<br> not available ';
	aparent.innerHTML = '';
	aparent.appendChild(fallbackText);		
}

async function setVideoUrl(vidContainer, vidUrl) {
	const videoPageUrl = vidUrl.replace('/media/', '/api/');
	fetch(videoPageUrl)
		.then(response => {
			if (!response.ok) {
				document.getElementById('videoContainer').innerHTML = '<p>Network response was not ok</p>';
				throw new Error('Network response was not ok');
			}
			return response.text();
		})
		.then(html => {
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, 'text/html');
			const videoElement = doc.querySelector('video');
			if (videoElement) {
				//const videoSrc = videoElement.getAttribute('src');
				//document.getElementById('videoContainer').innerHTML = videoElement.outerHTML;
				//console.log(videoElement.getAttribute('src'));
				vidContainer.src = videoElement.getAttribute('src');
			} else {
				//console.log('vidp1 = '+vidContainer.parentElement);
				//console.error('There was a problem with the fetch operation:', 'No video element found');
				SetNotAvailable(vidContainer.parentElement);
				return;
			}
		})
		.catch(error => {
			//console.log('vidp2 = '+vidContainer.parentElement);
			SetNotAvailable(vidContainer.parentElement);
			//console.error('There was a problem with the fetch operation:', error);
			return;
		});
}

function ImgOnError(img) {
	SetNotAvailable(img.parentElement);
/*	const fallbackText = document.createElement('div');
	fallbackText.style.color = 'white';
	fallbackText.style.backgroundColor = 'black';
	fallbackText.style.textAlign = 'center';
	fallbackText.style.height = '100%';
	fallbackText.style.display = 'flex';
	fallbackText.style.justifyContent = 'center';
	fallbackText.style.alignItems = 'center';
	fallbackText.innerHTML = img.alt + '<br> not available ';
	gridItem.innerHTML = '';
	gridItem.appendChild(fallbackText);	
*/}

function ImgOnClick(img) {
	const linkList = document.getElementById('link-list');
	if (linkList.style.display === 'block') {
		linkList.style.display = 'none';
	} else {
		// Create fullscreen overlay if the link list is not visible
		const fullImg = document.createElement('img');
		fullImg.src = img.src;
		fullImg.style.width = '100vw';
		fullImg.style.height = '100vh';
		fullImg.style.objectFit = 'contain';
		const overlay = document.createElement('div');
		overlay.style.position = 'fixed';
		overlay.style.top = '0';
		overlay.style.left = '0';
		overlay.style.width = '100%';
		overlay.style.height = '100%';
		overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
		overlay.style.display = 'flex';
		overlay.style.justifyContent = 'center';
		overlay.style.alignItems = 'center';
		overlay.style.zIndex = '1000';
		overlay.onclick = () => document.body.removeChild(overlay);
		overlay.appendChild(fullImg);
		document.body.appendChild(overlay);
	}
}

function MenuClick(span) {
//	alert(span.dataset.id);
	const linkList = document.getElementById('link-list');
	linkList.style.display = 'none';
	imgIndex = parseInt(span.dataset.id ?? 0, 10);
	createGridItem();
}

function ShowMenu() {
	const linkList = document.getElementById('link-list');
	linkList.style.display = linkList.style.display === 'block' ? 'none' : 'block';
	const ul = document.getElementById('link-list-ul'); // Target the UL element
	//console.log(ul.childElementCount);
	if(ul.childElementCount==0) {
		let i = 0;
		dataJson.forEach(item => {
			const li = document.createElement('li');
			const span = document.createElement('span'); // Use span instead of a
			span.className = 'link';
			span.textContent = item.title;
			
			// Add click event to run the corresponding function
			span.onclick = () => {
			  MenuClick(span); // Call the function using window object
			};
			span.dataset.id = i;
			//console.log(item.title);
			li.appendChild(span);
			ul.appendChild(li); // Append each link to the UL element		
			i = i+1;
		})
	}
}

// Function to filter links based on input
function filterLinks() {
  const filterValue = document.getElementById('filter-input').value.toLowerCase();
  const ul = document.getElementById('link-list-ul');
  const links = ul.getElementsByTagName('li');

  // Loop through the links and hide those that don't match the filter
  Array.from(links).forEach(link => {
	const span = link.getElementsByTagName('span')[0];
	if (span.textContent.toLowerCase().includes(filterValue)) {
	  link.style.display = ''; // Show matching link
	} else {
	  link.style.display = 'none'; // Hide non-matching link
	}
  });
}
	
document.getElementById('filter-input').addEventListener('input', filterLinks);

function VideoOnClick(video) {
  const linkList = document.getElementById('link-list');
  if (linkList.style.display === 'block') {
    linkList.style.display = 'none';
  } else {
    // Create fullscreen overlay if the link list is not visible
    const fullVideo = document.createElement('video');
    fullVideo.src = video.src;
    fullVideo.style.width = '100vw';
    fullVideo.style.height = '100vh';
    fullVideo.style.objectFit = 'contain';
    fullVideo.controls = false; // Enable controls like play, pause, etc.
    fullVideo.autoplay = true; // Start playing automatically
    fullVideo.loop = video.loop; // Keep the loop setting if applied to original video

	// Pause all other videos on the page, still loading, must 
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach(v => {
		v.pause();
		v.dataset.src = v.src;
		v.removeAttribute('src');
		v.load();
	}); // Pause all videos	  
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';
    overlay.onclick = () => {
      fullVideo.pause(); // Pause the video before removing
      document.body.removeChild(overlay);
		// reload all other videos on the page
		const allVideos = document.querySelectorAll('video');
		allVideos.forEach(v => {
			//v.load();
			v.src = v.dataset.src;
		}); // load all videos	  
    };
    overlay.appendChild(fullVideo);
    document.body.appendChild(overlay);
  }
}

function PauseAll() {
/*	const gridContainer = document.getElementById('grid-container');
	const containers = gridContainer.getElementsByClassName('grid-item');
	for(griditem of containers) {
		//for(item of griditem) {
			console.log(griditem.id);
		//}
	}
*/
	let videos = document.querySelectorAll('.grid-item video');
	videos.forEach(video => {
		console.log('pause = '+video.src);
		video.pause();
	});		
	
}

function ResumeAll() {
/*	const gridContainer = document.getElementById('grid-container');
	const containers = gridContainer.getElementsByClassName('grid-item');
	for(griditem of containers) {
		//for(item of griditem) {
			console.log(griditem.id);
		//}
	}
*/
	let videos = document.querySelectorAll('.grid-item video');
	videos.forEach(video => {
		//console.log('pause = '+video.src);
		video.play();
	});		
}

function AllImage() {
	// Select all img elements with id="image"
	//let images = document.querySelectorAll('img#image');
	// Select all img elements inside grid-item divs
	let images = document.querySelectorAll('.grid-item img');
	images.forEach(image => {
		console.log('image = '+image.src);
	});		
}

async function createGridItem(offset = 0) {
//	console.log('recreate grid item=' + imgIndex + ' / ' + offset + ' / ' + (imgIndex + offset) + ' / ' + (imgIndex + totalCells));
	try {
		const gridContainer = document.getElementById('grid-container');
		const linkList = document.getElementById('link-list');
		if (linkList.parentNode) {
			gridContainer.removeChild(linkList);
		}
		if (offset == 0) {
			gridContainer.innerHTML = '';
		}
		//var i = 0;
		dataJson.slice(imgIndex + offset, imgIndex + totalCells).forEach(item => {
			//i = i + 1;
			const gridItem = document.createElement('div');
			gridItem.id='grid-item';
			gridItem.classList.add('grid-item');
			var newTimestamp = new Date().getTime();
			if (plnUrl) {
				titleItem = '🟡 '+item.cameraName;
				var videosrc = item.streamingURL;
				///console.log(videosrc);
				var imagesrc = item.streamingURL + '&tx=' + newTimestamp;
				imagesrc = imagesrc.replace('&format=fmp4&', '&format=jpeg&');
			} else if (item.pln) {
				//console.log('pln: ' +item.title);
				titleItem = '🟣 '+item.title;
				var videosrc = getPlnUrl(item.pln, item.cameraId);
				//console.log('videosrc: ' +videosrc);
				if(videosrc) {
					var imagesrc = videosrc + '&tx=' + newTimestamp;
					imagesrc = imagesrc.replace('&format=fmp4&', '&format=jpeg&');
				}
			} else if (item.samagov) {
				titleItem = '🟢 '+item.title;
				var imagesrc = samagovUrl + item.samagov + '/live-image';
				//const fileNameWithExtension = item.url.split('/').pop(); 
				//const fileName = fileNameWithExtension.split('.')[0];
				//var videosrc = 'https://gmno1.github.io/cctv/v?id='+fileName;
				videosrc = samagovUrl + item.samagov + '/stream';
				//console.log("diskominfo:"+videosrc);
			} else if (item.diskominfo) {
				titleItem = '🟢 '+item.title;
				var imagesrc = diskominfoUrl + item.diskominfo + '/cover?t=' + newTimestamp;
				//const fileNameWithExtension = item.url.split('/').pop(); 
				//const fileName = fileNameWithExtension.split('.')[0];
				//var videosrc = 'https://gmno1.github.io/cctv/v?id='+fileName;
				videosrc = diskominfoUrl + item.diskominfo;
				//console.log("diskominfo:"+videosrc);
			} else {
				titleItem = '🟢 '+item.title;
				var imagesrc = item.url + '/cover?t=' + newTimestamp;
				imagesrc = imagesrc.replace('/media/', '/api/');
				//const fileNameWithExtension = item.url.split('/').pop(); 
				//const fileName = fileNameWithExtension.split('.')[0];
				//var videosrc = 'https://gmno1.github.io/cctv/v?id='+fileName;
				videosrc = item.url;
				//console.log("url:"+videosrc);
			}
			//console.log(titleItem);
			if (modeIndex == 0) {
				const img = document.createElement('img');				
				if((!imagesrc)&&(item.pln)) {
					//console.log('wait');
					img.dataset.pln=item.pln;
					img.dataset.cameraId=item.cameraId;
				} else {
					//console.log('imagesrc='+imagesrc);
					img.src = imagesrc;
				}
				img.id = "image";
				//img.src = 'https://via.placeholder.com/1600x900'; 
				img.alt = titleItem;
				img.onerror = () => {
					ImgOnError(img);
				};
				img.addEventListener('click', () => {
					ImgOnClick(img);
				});
				gridItem.appendChild(img);
			} else if (modeIndex == 1) {
				const vidFrame = document.createElement('video');
				if (item.pln) {
					//console.log('modeIndex=1 / plnUrl = '+videosrc);					
					if(videosrc) {
						vidFrame.src = videosrc;
					} else {
						vidFrame.dataset.pln=item.pln;
						vidFrame.dataset.cameraId=item.cameraId;					
					}
				} else {
					//console.log('modeIndex=1 / not plnUrl = '+videosrc);
					setVideoUrl(vidFrame, videosrc);
				}
				vidFrame.autoplay = true;
				vidFrame.playsinline = true;
				vidFrame.addEventListener('click', () => {
					VideoOnClick(vidFrame);
				});
				gridItem.appendChild(vidFrame);
			} else if (modeIndex == 11) {
				const vidFrame = document.createElement('iframe');
				vidFrame.src = videosrc;
				vidFrame.allowFullscreen = true; // Adds the allowfullscreen attribute
				vidFrame.addEventListener('click', () => {
					VideoOnClick(vidFrame);
				});
				//vidFrame.setAttribute('allowfullscreen', ''); // You can also use setAttribute if you prefer
				gridItem.appendChild(vidFrame);
			} else {
				const vidFrame = document.createElement('iframe');
				const fileNameWithExtension = item.url.split('/').pop();
				const fileName = fileNameWithExtension.split('.')[0];
				vidFrame.src = item.url.replace('/media/', '/api/');
				vidFrame.allowFullscreen = true; // Adds the allowfullscreen attribute
				vidFrame.addEventListener('click', () => {
					VideoOnClick(vidFrame);
				});
				//vidFrame.setAttribute('allowfullscreen', ''); // You can also use setAttribute if you prefer
				gridItem.appendChild(vidFrame);
			}
			const title = document.createElement('div');
			title.classList.add('grid-item-title');
			title.id = "title";
			title.textContent = titleItem; // Set title text
			gridItem.dataset.title=titleItem;
			gridItem.appendChild(title);
			gridContainer.appendChild(gridItem);
		});
		//console.log('added: '+i);
		gridContainer.appendChild(linkList);
	} catch (error) {
		console.error('There has been a problem with your fetch operation:', error);
	}
}

function createGrid(newZoomIndex = zoomIndex) {
	const screenWidth = window.innerWidth;
	const screenHeight = window.innerHeight;
	let columns, rows;
	if (fixCell) {
		columns = totalColumns;
		rows = totalRows;
	} else {
		if (newZoomIndex <= 0) {
			columns = 1;
			rows = Math.round(screenHeight / ((screenWidth / columns) / 16 * 9));
		} else {
			if (screenWidth < screenHeight) {
				columns = 1 + newZoomIndex - 1;
				rows = Math.round(screenHeight / ((screenWidth / columns) / 16 * 9));
				//console.log('1 col= '+columns);
			} else if (screenWidth > screenHeight) {
				columns = 2 + newZoomIndex - 1;
				rows = Math.round(screenHeight / ((screenWidth / columns) / 16 * 9));
				//console.log('2 col= '+columns);
			} else {
				columns = 2 + newZoomIndex - 1;
				rows = 3 + newZoomIndex - 1;
				//console.log('3 col= '+columns);
			}
		}
		/*
	const splitHeight = 800;
	const splitWidth = 600;
	if (screenHeight < splitHeight && screenWidth < screenHeight) {
	columns = 1;
	rows = Math.round(screenHeight / (screenWidth / 16 * 9));
	} else if (screenHeight >= splitHeight && screenWidth < screenHeight) {
	if (screenWidth < splitWidth ) { columns = 1; }
	else { columns = 2; }
	rows = Math.round(screenHeight / ((screenWidth / 2) / 16 * 9));
	} else if (screenWidth < splitWidth && screenWidth > screenHeight) {
	columns = 1;
	rows = Math.round(screenHeight / (screenWidth / 16 * 9));
	} else if (screenWidth >= splitWidth && screenWidth > screenHeight) {
	columns = 2;
	rows = Math.round(screenHeight / ((screenWidth / 2) / 16 * 9));
	} else if (screenWidth < splitWidth) {
	columns = 1;
	rows = 2;
	} else {
	columns = 2;
	rows = 3;
	}
	*/
	}
	if (columns !== totalColumns || rows !== totalRows || totalCells == 0) {
		const gridContainer = document.getElementById('grid-container');
		const containers = gridContainer.getElementsByClassName('grid-item');
		totalContainer = containers.length;
		//console.log('z recreate grid ' + columns + 'x' + rows+' = '+totalContainer);
		gridContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
		gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
		totalColumns = columns;
		totalRows = rows;
		totalCells = columns * rows;
		zoomIndex = newZoomIndex;
		if (dataCount < 0) {
			loadData();
		} else {
			if (totalCells < totalContainer) {
				//console.log('remove info: '+totalCells+' / '+totalContainer);
				//delCount = totalContainer-totalCells;
				for (let i = totalContainer - 1; i >= totalCells; i--) {
					//console.log('remove '+i);
					gridContainer.removeChild(containers[i]);
				}
			} else if (totalCells > totalContainer) {
				//console.log('add '+totalCells+' / ' +totalContainer);
				createGridItem(totalContainer);
			} else {
				//console.log('else '+totalCells+' / '+totalContainer);
				createGridItem();
			}
		}
	}
}

function nextContent() {
	if (dataCount < 0) {
		return;
	}
	if ((imgIndex + totalCells) < dataCount) {
		var newIndex = imgIndex + totalCells;
		if (newIndex !== imgIndex) {
			imgIndex = newIndex;
			createGridItem();
		}
	}
}

function prevContent() {
//	console.log('prevContent');
	if (dataCount < 0) {
		return;
	}
	if (imgIndex == 0) {
		return;
	}
	imgIndex = imgIndex - totalCells;
	if (imgIndex < 0) {
		imgIndex = 0;
	}
	createGridItem();
}

function pageContent(pageIndex) {
	//console.log("pageContent = "+pageIndex);
	if (dataCount < 0) {
		return;
	}
	var newIndex;
	if ((pageIndex * totalCells) < dataCount) {
		newIndex = pageIndex * totalCells;
	} else {
		newIndex = dataCount - totalCells;
	}
	if (newIndex !== imgIndex) {
		imgIndex = newIndex;
		createGridItem();
	}
}

function firstContent(pageIndex) {
	if (dataCount < 0) {
		return;
	}
	if (imgIndex == 0) {
		return;
	}
	imgIndex = 0;
	createGridItem();
}

function lastContent(pageIndex) {
	if (dataCount < 0) {
		return;
	}
	var newIndex = dataCount - totalCells;
	if (newIndex !== imgIndex) {
		imgIndex = newIndex;
		createGridItem();
	}
}

function handleButtonClick(buttonId) {
	const playbtn = document.getElementById('play-btn');
	const stopbtn = document.getElementById('stop-btn');
	switch (buttonId) {
		case 'fullscreen-btn':
			toggleFullscreen();
			break;
		case 'menu-btn':
			//const linkList = document.getElementById('link-list');
			//linkList.style.display = linkList.style.display === 'block' ? 'none' : 'block';
			ShowMenu();
			break;
		case 'refresh-btn':
			createGridItem();
			break;
		case 'play-btn':
			playbtn.style.display = 'none';
			stopbtn.style.display = 'block';
			modeIndex = 1;
			createGridItem();
			break;
		case 'stop-btn':
			playbtn.style.display = 'block';
			stopbtn.style.display = 'none';
			modeIndex = 0;
			//createGridItem();
			PauseAll();
			break;
		case 'prev-btn':
			prevContent()
			break;
		case 'next-btn':
			nextContent()
			break;
		case 'zoom-btn':
			zoomNext();
			break;
		case 'zoom-in-btn':
			alert('Zoom In button clicked');
			break;
		case 'zoom-out-btn':
			alert('Zoom Out button clicked');
			break;
		default:
			alert('Unknown button clicked');
	}
}

function onLoad() {
	if (isAskFullscreen == 1) {
		askFullscreen();
	} else {
		createGrid();
	}
}

function onResize() {
	//console.log('resize');
	if (isAskFullscreen == 0) {
		createGrid();
	}
}

function showInfo() {
	const screenWidth = window.innerWidth;
	const screenHeight = window.innerHeight;
	const cellWidth = screenWidth / totalColumns;
	const cellHeight = screenHeight / totalRows;
	alert('screenWidth=' + screenWidth +
		'\nscreenHeight=' + screenHeight +
		'\nscreenRatio=' + (screenHeight / screenWidth) +
		'\n\ntotalColumns=' + totalColumns +
		'\ntotalRows=' + totalRows +
		'\ntotalCells=' + totalCells +
		'\n\nCellWidth=' + cellWidth +
		'\nCellHeight=' + cellHeight +
		'\nCellRatio=' + (cellHeight / cellWidth) +
		'\n\nPicRatio=' + (720 / 1280)
	);
}

document.getElementById('fullscreen-btn').addEventListener('click', () => handleButtonClick('fullscreen-btn'));
document.getElementById('menu-btn').addEventListener('click', () => handleButtonClick('menu-btn'));
document.getElementById('refresh-btn').addEventListener('click', () => handleButtonClick('refresh-btn'));
document.getElementById('play-btn').addEventListener('click', () => handleButtonClick('play-btn'));
document.getElementById('stop-btn').addEventListener('click', () => handleButtonClick('stop-btn'));
document.getElementById('prev-btn').addEventListener('click', () => handleButtonClick('prev-btn'));
document.getElementById('next-btn').addEventListener('click', () => handleButtonClick('next-btn'));
document.getElementById('zoom-btn').addEventListener('click', () => handleButtonClick('zoom-btn'));
/*
document.getElementById('zoom-in-btn').addEventListener('click', () => handleButtonClick('zoom-in-btn'));
document.getElementById('zoom-out-btn').addEventListener('click', () => handleButtonClick('zoom-out-btn'));
*/
window.addEventListener('load', onLoad);
window.addEventListener('resize', onResize);

document.addEventListener('keydown', function(event) {
	const output = document.getElementById('output');

	// Check which key was pressed
	switch (event.key) {
		case 'p':
			PauseAll();
			break;
		case 'i':
			AllImage();
			break;
		case '+':
			zoomBack();
			break;
		case '-':
			zoomNext();
			break;
		case 'ArrowUp':
			firstContent();
			break;
		case 'ArrowDown':
			lastContent();
			break;
		case 'ArrowRight':
			nextContent();
			break;
		case 'ArrowLeft':
			prevContent();
			break;
		case ' ': // space -> refresh
			createGridItem();
			break;
		case 'Enter':
			toggleFullscreen();
			break;
		case 'i':
			showInfo();
			break;
		case '`': // last data
		case '/':
		case '*':
			lastContent();
			break;
		case '0':
		case '1':
		case '2':
		case '3':
		case '4':
		case '5':
		case '6':
		case '7':
		case '8':
		case '9':
			pageContent(parseInt(event.key, 10));
			//console.log(`Number ${event.key} pressed!`);
			break;
	}
});

function zoomNext() {
	//alert('Zoom In button clicked');
	const screenWidth = window.innerWidth;
	const screenHeight = window.innerHeight;
	var minWidth;
	if (screenWidth > screenHeight) {
		minWidth = screenHeight;
	} else {
		minWidth = screenWidth;
	}
	maxZoom = Math.floor(minWidth / 270);
	if (maxZoom < 2) {
		maxZoom = 2;
	}
	newzoomIndex = (zoomIndex + 1) % maxZoom;
	//console.log('zoom=' + zoomIndex + ' / to=' + newzoomIndex)
	createGrid(newzoomIndex);
}

function zoomBack() {
	//alert('Zoom In button clicked');
	const screenWidth = window.innerWidth;
	const screenHeight = window.innerHeight;
	var minWidth;
	if (screenWidth > screenHeight) {
		minWidth = screenHeight;
	} else {
		minWidth = screenWidth;
	}
	maxZoom = Math.floor(minWidth / 270);
	if (maxZoom < 2) {
		maxZoom = 2;
	}
	newzoomIndex = (zoomIndex - 1) % maxZoom;
	if (newzoomIndex < 0) {
		newzoomIndex = maxZoom - 1;
	}
	//console.log('zoomBack=' + zoomIndex + ' / to=' + newzoomIndex)
	createGrid(newzoomIndex);
}

function swipeEvent(id, swipeid) {
	console.log('swipe=' + id + ' / to=' + swipeid)
	if (id == 'grid-container') {
		switch (swipeid) {
			case 'l':
				nextContent();
				break;
			case 'r':
				prevContent();
				break;
		}
	} else if (id == 'zoom-btn') {
		zoomBack();
	} else if (id == 'prev-btn') {
		firstContent();
	} else if (id == 'next-btn') {
		lastContent();
	}
}

let swipeAreas = document.querySelectorAll('.swipeArea');

let startX = 0;
let startY = 0;
let endX = 0;
let endY = 0;
const minSwipeDistance = 50;

// Swipe handler function
function handleSwipeStart(e) {
	startX = e.touches[0].clientX;
	startY = e.touches[0].clientY;
}

function handleSwipeMove(e) {
	endX = e.touches[0].clientX;
	endY = e.touches[0].clientY;
}

function handleSwipeEnd(e) {
	if ((endX == 0) && (endY == 0)) {
		return;
	}
	let diffX = endX - startX;
	let diffY = endY - startY;
	//console.log('endX='+endX+' / startX='+startX);
	//console.log('endY='+endY+' / startY='+startY);

	// Identify which swipe area was swiped
	let swipeAreaId = e.currentTarget.getAttribute('id');
	// Determine swipe direction
	if (Math.abs(diffX) > Math.abs(diffY)) {
		// Horizontal swipe
		if (Math.abs(diffX) > minSwipeDistance) {
			console.log('x=' + Math.abs(diffX) + ' > ' + minSwipeDistance);
			if (diffX > 0) {
				swipeEvent(swipeAreaId, 'r');
				//alert('Swipe Right on Area ' + swipeAreaId);
			} else {
				swipeEvent(swipeAreaId, 'l');
				//alert('Swipe Left on Area ' + swipeAreaId);
			}
		}
	} else {
		// Vertical swipe
		if (Math.abs(diffY) > minSwipeDistance) {
			console.log('y=' + Math.abs(diffY) + ' > ' + minSwipeDistance);
			if (diffY > 0) {
				swipeEvent(swipeAreaId, 'd');
				//alert('Swipe Down on Area ' + swipeAreaId);
			} else {
				swipeEvent(swipeAreaId, 'u');
				//alert('Swipe Up on Area ' + swipeAreaId);
			}
		}
	}
	// Reset values
	startX = 0;
	startY = 0;
	endX = 0;
	endY = 0;
}

// Attach swipe event listeners to each swipe area
swipeAreas.forEach(swipeArea => {
	swipeArea.addEventListener('touchstart', handleSwipeStart);
	swipeArea.addEventListener('touchmove', handleSwipeMove);
	swipeArea.addEventListener('touchend', handleSwipeEnd);
});

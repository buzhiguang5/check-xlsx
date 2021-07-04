
var fs = require("fs")
var $path = require("path")
var xlsx = require('node-xlsx');
 
var root = $path.join(process.cwd(), '配置表')

var imageCount = 0
var soundCount = 0
var distDir =  '__image_all' 
var distSoundDir =  '__sound_all' 
 
 
// checkOrCreateDir($path.join(root,distDir)) // 检查目录并创建
// checkOrCreateDir($path.join(root,distSoundDir)) // 检查目录并创建 

let allFileCache = []
try{
	readDir($path.join(root)).then(res=>{
		checkXlsxFile(allFileCache)
	}, err=>{
		console.log(err)
	})
}catch(e){
}
function readDir(path){
	return new Promise(async (resolve, reject)=>{
		try{
			var menu = fs.readdirSync(path)
			if(!menu){
				reject()
				return
			}
			for(let i=0; i<menu.length; i++){
				let ele = menu[i]
				var info = fs.statSync($path.join(path,ele))
				var newPath = $path.join(path,ele)
				if(info.isDirectory()){
					// console.log("dir: "+ele)
					currentDir = ele
					await readDir(newPath)
				}else{
					if(/\.(xlsx|xls)$/.test(ele) && ele.indexOf('~$')===-1){ //~$为打开的excel文件
						allFileCache.push(newPath)
						// console.log(`file: ${newPath}`)
					}
				}
			}
			resolve()
		}catch(e){
			console.log(e)
			reject(e)
		}
	})
} 
function checkXlsxFile(fileList){
	var totalFiles = fileList.length
	var errorFiles = 0
	var successFiles = 0
	for(let i=0; i<fileList.length; i++){
		try{
			let newPath = fileList[i];
			(()=>{
				// 解析得到文档中的所有 sheet
				var sheets = xlsx.parse(newPath)
				// console.log('sheets:',sheets)
				let startIndex = 5 // 开始行的索引（数据类型行）
				let sheet = sheets[0] // 读取第一张表
				let keyRow = sheet['data'][4] // 数据类型 int string json long bool
				let typeRow = sheet['data'][startIndex] // 数据类型 int string json long bool
				sheet['data'].forEach((row, index)=>{
					if(index > 5){
						if(row.length > typeRow.length){
							throw new Error(`列数超出范围。在 ${newPath} 第${index+1}行`)
						}
						for(let j=0; j<typeRow.length; j++){
							let col = row[j]
							if(col !== undefined){ // 允许为空
								let key = keyRow[j]
								let dt = typeRow[j]
								// console.log(j, dt,col, typeof col)
								let errTarget = `在 ${newPath} 第${index+1}行第${j+1}列。`
								if(/(^\s)|(\s$)/.test(col.toString()) ){
									throw new Error(`'${col}' 首尾有多余的空格符。${errTarget}`)
								}
								switch(dt){
									case 'int':
									if(typeof Number(col) !== 'number' || isNaN(Number(col))){
										throw new Error(`'${col}' 为非法的int。${errTarget}`)
									}
									break;
									case 'long':
									if(typeof Number(col) !== 'number' || isNaN(Number(col))){
										throw new Error(`'${col}' 为非法的long。${errTarget}`)
									}
									break;
									case 'bool':
									if(!(/^(false|true)$/.test(col))){
										throw new Error(`'${col}' 为非法的bool。${errTarget}`)
									}
									break;
									case 'json':
									try{
										JSON.parse(col)
									}catch(e){
										// console.log(  ` 333-- ${keyRow[j]} ${index}   [ ${newPath} ]`)
										col = col.toString().replace(/[\r\n]/g,'');
										throw new Error(`'${col}' 为非法的json。${errTarget}`)
									}
									break;
								}
							}
						}
					}
				})
				successFiles ++
				updateResult()
				// if(info.size>1024){ // 大于1024字节
				// 	if(/\.(jpg|png|gif)$/i.test(ele)){
				// 		imageCount ++
				// 		fs.copyFile($path.join(path,ele), $path.join(root,distDir,imageCount+'_'+ele) ,(err)=>{
				// 			// console.log('succ......',err);
				// 		})
						
				// 	}
				// 	if(/\.(mp3|ogg|wav|m4a)$/.test(ele)){
				// 		soundCount ++
				// 		fs.copyFile($path.join(path,ele), $path.join(root,distSoundDir,soundCount+'_'+ele) ,(err)=>{
				// 			// console.log('succ......',err);
				// 		})
						
				// 	}
				// }
			})()
		}catch(e){
			console.log(e)
			errorFiles ++
			updateResult()
		}
	}
	function updateResult(){
		if(successFiles + errorFiles === totalFiles){
			console.log(`共检测${totalFiles}个文件，成功${successFiles}，错误${errorFiles}`)
		}
	}
} 
// 检查目录是否存在，不存在就创建
function checkOrCreateDir(path){
	try{
		let statInfo = fs.statSync(path)
		if(statInfo&&statInfo.isDirectory()) { // statInfo.isFile()
			console.log('文件夹存在')
		}else{
			throw '不是文件夹'
		}
	}catch(error){
		// 目录不存在
		fs.mkdirSync(path) //同步创建目录
	}
	// 异步
	// fs.stat('/xxx', function(err, stat){  //fs.statSync
	//     if(stat&&stat.isFile()) {
	// 		console.log('文件存在');
	//     } else {
	// 		console.log('文件不存在或不是标准文件');
	//     }
	// });

}
setTimeout(()=>{
	console.log('close')
},999*60*1000)
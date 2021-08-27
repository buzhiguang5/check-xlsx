
var fs = require("fs")
var $path = require("path")
var xlsx = require('node-xlsx');
const chalk = require('chalk');
 
var imageCount = 0
var soundCount = 0
var distDir =  '__image_all' 
var distSoundDir =  '__sound_all' 

var versionHistory = [
	'******* 当前版本：2021-08-27 *******',
	'2021-08-27 增加id唯一性检测',
	'2021-08-02 增加道具ID有效性检测',
	'2021-07-07 修正换行误报Bug',
	'2021-06-06 初版发布',
]
console.log(versionHistory[0]);

paramsHandler()
// checkOrCreateDir($path.join(root,distDir)) // 检查目录并创建
// checkOrCreateDir($path.join(root,distSoundDir)) // 检查目录并创建 

var root = $path.join(process.cwd(), '配置表')
console.log('正在读取目录:' + root)

var columnBaseKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
var columnKeys = columnBaseKeys.slice()
for(let i=0; i<columnBaseKeys.length; i++){
	if(columnKeys[i] === "D"){
		break
	}
	for(let j=0; j<columnBaseKeys.length; j++){
		columnKeys.push(columnBaseKeys[i] + columnBaseKeys[j])
	}
}

let sheetsItemMap = {}
let allFileCache = []
try{
	readAllFiles($path.join(root)).then(res=>{
		// 将道具表放到最前，优先读取
		for(let i=0; i<allFileCache.length; i++){
			if(allFileCache[i].indexOf('道具表_ItemTemplate.xls')>-1){
				allFileCache = allFileCache.splice(i,1).concat(allFileCache)
				break
			}
		}
		// console.log('allFileCache:', allFileCache);
		checkXlsxFiles(allFileCache)
	}, err=>{
	})
}catch(e){
}
// 读取所有文件路径
function readAllFiles(path){
	return new Promise(async (resolve, reject)=>{
		try{
			var menu = fs.readdirSync(path)
			if(!menu){
				reject()
				return
			}
			for(let i=0; i<menu.length; i++){
				let ele = menu[i]
				var info = fs.statSync($path.join(path, ele))
				var newPath = $path.join(path, ele)
				if(info.isDirectory()){
					// console.log("dir: "+ele)
					await readAllFiles(newPath)
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
// 检测文件
async function checkXlsxFiles(fileList){
	var totalFiles = fileList.length
	var errorFiles = 0
	var successFiles = 0
	for(let i=0; i<fileList.length; i++){
		try{
			let newPath = fileList[i];
			if(i < 1){
				// 先同步读取道具表
				let sheetsData = await checkOneFile(newPath)
				for(let value of sheetsData){
					sheetsItemMap[value[0]] = value
				}
				// console.log('sheetsItemMap:', sheetsItemMap);
				// console.log('道具表_ItemTemplate 读取完成');
				updateResult()
			}else{
				// 异步读取
				checkOneFile(newPath).then(res=>{
					updateResult()
				},err=>{
					updateResult(err)
				})
			}
			
		}catch(e){
			updateResult(e)
		}
	}
	function checkOneFile(newPath){
		return new Promise((resolve, reject)=>{
			try{
				let sheetMap = {}
				var sheets = xlsx.parse(newPath)
				// console.log('sheets:',sheets)
				let startIndex = 5 // 开始行的索引（数据类型行）
				let sheet = sheets[0] // 读取第一张表
				let keyRow = sheet['data'][4] // 数据类型 int string json long bool
				let typeRow = sheet['data'][startIndex] // 数据类型 int string json long bool
				let idMap = {}
				sheet['data'].forEach((row, index)=>{
					if(index > 5){
						if(row.length > typeRow.length){
							throw new Error(`列数超出范围。在 ${newPath} 第${index+1}行`)
						}
						if(row.length > 0 && row[0] === undefined){
							throw new Error(`第 ${index+1} 行配置有误（缺少主键）。在 ${newPath} 第${index+1}行`)
						}
						
						for(let j=0; j<typeRow.length; j++){
							let col = row[j]
							if(col !== undefined){ // 允许为空
								let key = keyRow[j]
								let dt = typeRow[j]
								// console.log(j, dt,col, typeof col)
								// let errTarget = `在 ${newPath} 第${index+1}行第${j+1}列。`
								let errTarget = `在 ${newPath} 第${index+1}行第${columnKeys[j] || j+1}列。`
								// if(dt !== 'json' && /(^\s)|(\s$)/.test(col.toString()) ){
								// 	col = col.toString().replace(/(^\r\n|\r|\n)|(\r\n|\r|\n$)/g,' ');
								// 	// col = col.toString().replace(/\r\n|\r|\n/g,'');
								// 	throw new Error(`'${col}' 首尾有多余的空格或换行符。${errTarget}`)
								// }
								if(j === 0 && keyRow[j] === 'id'){
									// 检测id唯一性
									if(idMap[col] !== undefined){
										throw new Error(`主键id重复。${errTarget}`)
									}
									idMap[col] = true
								}
								if(col[0] === ' ' || col[col.length-1] === ' '){
									throw new Error(`'${col}' 首尾有多余的空格。${errTarget}`)
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
									let jsonData
									try{
										jsonData = JSON.parse(col)
									}catch(e){
										// console.log(  ` 333-- ${keyRow[j]} ${index}   [ ${newPath} ]`)
										// col = col.toString().replace(/[\r\n]/g,'');
										col = col.toString().replace(/\r\n|\r|\n/g,'');
										throw new Error(`'${col}' 为非法的json。${errTarget}`)
									}
									
									// 检测道具json
									if(sheetsItemMap && jsonData && newPath.indexOf('道具表_ItemTemplate.xls') === -1){
										let itemList = []
										if(Object.prototype.toString.call(jsonData)==="[object Object]" && jsonData.gift){
											jsonData = jsonData.gift
										}
										if(Object.prototype.toString.call(jsonData)==="[object Array]"  && jsonData[0] && jsonData[0].type){
											itemList = jsonData
										}
										for(let i=0; i<itemList.length; i++){
											if(itemList[i].type === 4 && itemList[i].id){
												// 查证道具
												if(sheetsItemMap[itemList[i].id]){
													// console.log('配置正确！');
												}else{
													// console.log('xxxxxxxx配置不正确！');
													throw new Error(`道具表中未找到相应的id。${errTarget}`)
												}
											}
										}

										// let success = checkItemJson(jsonData, errTarget)
									}
									break;
								}
							}
						}
					}
				})
				resolve(sheet['data'])
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
			}catch(e){
				reject(e)
			}
		})
	}
	function updateResult(e){
		if(e){
			errorFiles ++
			if(e && e.message){
				console.log('Error:', e.message)
				// console.log(chalk.blue('Error:', e.message))
				// console.log(chalk.hex('#000000').bgRed.bold('Error:' ) , chalk.hex('#e4131b').bold(e.message))
				// console.log(chalk.hex('#ff0000').bold('Error:', e.message))
				// 使用RGB颜色输出
				// console.log(chalk.rgb(4, 156, 219).underline('MCC'));

			}else{
				console.log(e)
			}
		}else{
			successFiles ++
		}
		if(successFiles + errorFiles === totalFiles){
			console.log(`\n`)
			console.log(`读取完成！共检测${totalFiles}个文件，成功${successFiles}，错误${errorFiles}`)
		}
	}
} 
// 检查 & 创建目录
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

function logger(data){
	if(!data) return
	if(typeof data === 'string'){
		data = [data]
	}
	var splitLine = '-------------------------------------------------------------------'
	console.log(splitLine)
	data.forEach((v,i)=>{
		console.log(v)
	})
	console.log(splitLine)
}
function paramsHandler(){
	process.argv.forEach((val, index) => {
		// console.log(`${index}: ${val}`)
		if(val === '-v' && versionHistory.length > 0){
			logger(versionHistory)
		}
	})
}
setTimeout(()=>{
	console.log('close')
},999*60*1000)

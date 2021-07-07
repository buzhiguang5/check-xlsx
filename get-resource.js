/**
 * 用于获取游戏的所有图片和音频文件
 */
var fs = require("fs")
var $path = require("path")

var root = $path.join(process.cwd())
var imageCount = 0
var imageSuccessCount = 0
var soundCount = 0
var soundSuccessCount = 0
var distDir =  '__image_all' 
var distSoundDir =  '__sound_all' 
 
 
checkOrCreateDir($path.join(root, distDir)) // 检查目录并创建
checkOrCreateDir($path.join(root, distSoundDir)) // 检查目录并创建 

readDir($path.join(root))
function readDir(path){
	fs.readdir(path, (err, menu) =>{
		if(!menu){
			return
		}
		for(let i=0; i<menu.length; i++){
			let ele = menu[i]
			fs.stat($path.join(path,ele), (err, info) =>{
				var newPath = $path.join(path,ele)
				if(info.isDirectory()){
					// console.log("dir: "+ele)
					readDir(newPath)
				}else{
					if(info.size>1024){ // 大于1024字节
						if(/\.(jpg|png|gif)$/i.test(ele)){
							let pathFrom = $path.join(path,ele)
							let pathTo = $path.join(root, distDir, imageCount + '_'+ ele)
							imageCount ++
							fs.copyFile(pathFrom, pathTo, (err)=>{
								if(!err){
									imageSuccessCount ++
									console.log(`Image ${imageSuccessCount} copied successfully.`);
								}
							})
							
						}
						if(/\.(mp3|ogg|wav|m4a)$/.test(ele)){
							let pathFrom = $path.join(path,ele)
							let pathTo = $path.join(root, distSoundDir, soundCount + '_' + ele)
							soundCount ++
							fs.copyFile(pathFrom, pathTo, (err)=>{
								if(!err){
									soundSuccessCount ++
									console.log(`Audio ${soundSuccessCount} copied successfully.`);
								}
							})
							
						}
					}
				}
			})
		}
	})
}
// 检查目录是否存在，不存在就创建
function checkOrCreateDir(path){
	try{
		let statInfo = fs.statSync(path)
		if(statInfo && statInfo.isDirectory()) { // statInfo.isFile()
			console.log('文件夹存在')
		}else{
			throw '不是文件夹'
		}
	}catch(error){
		// 目录不存在
		fs.mkdirSync(path) //同步创建目录
	}

}
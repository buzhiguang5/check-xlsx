/**
 * 修改MP3元属性
 */
var fs = require("fs")
var $path = require("path")
const NodeID3 = require('node-id3')   

var coverImg = getCoverImage() // base64图片
var base64Data = coverImg.replace(/^data:image\/\w+;base64,/, "");
var coverImageBuffer = new Buffer(base64Data, 'base64'); // var base64Str = buffer.toString('utf-8') 

var root = $path.join(process.cwd(), 'public')

var distDir =  '__dist_mp3'
var successFiles = 0

// checkOrCreateDir($path.join(root, 'public', distDir)) // 检查目录并创建

async function main(){
	await tryCreateDir($path.join(root, distDir)) // 检查目录并创建

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
						if(/\.(mp3|mp333)$/.test(ele)){
							// console.log("file: ", ele)
							// console.log("info: ", info) 
							let pathFrom = $path.join(path,ele)
							let pathTo = $path.join(root, distDir, ele)
							// soundCount ++
							fs.copyFile(pathFrom, pathTo, (err)=>{
								if(!err){
									let name = ele.replace('.mp3', '')
									let tags = {
										title: name, // 标题
										subtitle: name, // 副标题
										album: name, // 唱片集
										year: "2020", // 年
										performerInfo: "performerInfo", // 唱片集艺术家
										genre: "genre", // 流派
										composer: "composer", // 作曲者
										artist: "artist", // 参与创作的艺术家
										remixArtist: "remixArtist", // 混音艺术家
										conductor: "conductor", // 指挥者
										originalArtist: "originalArtist", // 原创艺术家
										image: {
											description: "xx",
											imageBuffer: coverImageBuffer,
										},
		
									}
									let success = NodeID3.update(tags, pathFrom)
									if(success){
										successFiles ++
										console.log(`> ${successFiles} '${ele}' operation successfully.`);
									}
								}
							})
						}
					}
				})
			}
		})
	}
}

main()

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

function tryCreateDir(dirpath){
	return new Promise((resolve,reject)=>{
		mkdirs(dirpath, ()=>{
			resolve()
		})
		function mkdirs(dirpath, callback) {
			fs.exists(dirpath, function(exists) {
				if(exists) {
					callback();
				} else {
					//尝试创建父目录，然后再创建当前目录
					mkdirs($path.dirname(dirpath), function(){
							fs.mkdir(dirpath, callback);
						});
				}
			})
		};
	})
}
function getCoverImage(){
	return `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD//gAUU29mdHdhcmU6IFNuaXBhc3Rl/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUEBAUKBwcGCAwKDAwLCgsLDQ4SEA0OEQ4LCxAWEBETFBUVFQwPFxgWFBgSFBUU/9sAQwEDBAQFBAUJBQUJFA0LDRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU/8AAEQgAFwAZAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A/RisXWvFEGk+aEC3Elrsku4VbEkUB6yhcfMB1OOwPcYOpdXcVlEskz7EaRIgcE/M7BVHHqzAfjXkV3r0WtaxZwR6vavLLdBYWi1O1uGt2dgD5Lh0kGc/dKyA9NuK8vM8a8JCKi/elotvLu+7X9O69TLMEsXOTkvdirvfz7Lsn/Ss/YY5EmjWSNg6MAyspyCD0INOqjoUdlFo1kNOGLAxK8GAQNhGRgHkDB6dunFXq9ePNyrm3PIly8z5ditqOnQaraNbXKs0TMrfJIyMCrBlIZSCCCAeD2qh/wAIrZf899S/8Glz/wDHKKKsk0rO0i0+zgtbdPLggjWKNMk7VAwBk89BU1FFID//2Q==`
}
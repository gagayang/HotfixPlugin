
var path = require('path');
var fs = require('fs');
function HotFixPlugin(options) {
	if(options !== undefined && typeof options !== "object" || Array.isArray(options)) {
		throw new Error("Argument should be an options object");
	}
	this.options = options || {};
}
module.exports = HotFixPlugin;

var getFileModule = function(files, chunks, filter){

	var returnArr = [];

	for(var w = 0; w < chunks.length; w++){
		var chunk = chunks[w];

		for(var i = 0; i < chunk.modules.length; i++){
			var tempModel = chunk.modules[i];
			if(tempModel.resource){
				var index = tempModel.resource.indexOf(filter);

				if(index!=-1&&tempModel.resource.indexOf("js")!=-1){
					for(var j = 0; j < files.length; j++){
						var tempFile = files[j];
						
						if(tempModel.resource.indexOf(tempFile)!=-1){
							returnArr.push(tempModel);
						}
					}
				}
			}
		
		}
	}

	return returnArr;
}

var getFileByModule = function(files, modules, filter){
	var returnArr = [];
	for(var q = 0; q < modules.length; q++){
		var tempModel = modules[q];
		if(tempModel.resource){
			var index = tempModel.resource.indexOf(filter);

			if(index!=-1){
				for(var j = 0; j < files.length; j++){
					var tempFile = files[j];
					
					if(tempModel.resource.indexOf(tempFile)!=-1){
						returnArr.push(tempModel);
					}
				}
			}
		}
	}
	return returnArr;	
}


HotFixPlugin.prototype.apply = function(compiler) {
	var self = this;
	var options = this.options;
	this.nextFreeChunkId = 0;
	this.nextFreeModuleId = 1;
	self.fileMap = {};
	var chunkCount = this.chunkCount;
	compiler.plugin("compilation", function(compilation) {
		compilation.mainTemplate.plugin("add-module", function(source, chunk, hash, varModuleId, varModule) {
			
			return this.asString([
				"var _m = " + varModule + ";",
				"if("+varModuleId +"== 0){",
					"modules[" + varModuleId + "] = _m;",
				"}else{",
				"if(!modules["+ varModuleId +"]){",
					"modules[" + varModuleId + "] = _m;",
				"}",
				"}"
			]);


		})

		

		compilation.plugin("optimize-chunks", function(chunks) {
		});
		compilation.plugin("after-optimize-chunks", function(chunks) {
			var newCk = null
			if(options.target == "hotfix"){
				var fileNames = options.hotfixFile;
				var filter = options.filter;
				var arr = getFileModule(fileNames, chunks, filter);
			
				if(arr.length > 0){
					var hotFixChunkId = new Date().getTime();
					newCk = this.addChunk("hotfix", arr[0]);
					newCk.id = hotFixChunkId;
					
					for (var i = 0; i < arr.length; i++) {

						var tempModel = arr[i];
						
						newCk.addModule(tempModel);
						tempModel.addChunk(newCk);
					};
					
					this.chunks.push(newCk); 
				}
				
				

				// console.log(this.chunks)
			}else{
				
			}
		});
		compilation.plugin("optimize-module-ids",function(modules){
			if(options.target == "hotfix"){

				var fileNames = options.hotfixFile;
				var filter = options.filter;
				var chunks = this.chunks;
				var mapFilePath = options.mapModulePath;
				var mapFileName = options.mapModuleFile;
				var contentText = fs.readFileSync(mapFilePath+mapFileName,'utf-8');
				var jsonContext = JSON.parse(contentText);//{"path":id}
				
				var idArray = [];
				var length = modules.length;
				var idFlag = false;

				var max = jsonContext.max;

				for(var j  = 0; j < length; j++){

					var tempModel1 = modules[j];
					var id = null;
					
					
					if(tempModel1.resource && tempModel1.resource.indexOf(".js")!=-1){
						var newAddModule = true;
						// console.log(tempModel1.resource)
						var index = tempModel1.resource.indexOf(options.filter);
						if(index !=-1){
							var name = tempModel1.resource.substr(index)
							for(var i in jsonContext){
								var tempId = jsonContext[i];
								
								if(i == name){
									id = tempId;
									tempModel1.id = id;
									newAddModule = false;
								}
							
							}

							if(newAddModule){
								id = max++;
								
								tempModel1.id = id;
							}
							
							// tempModel1.id = id;
						}
						
					

					}
				}
			
			}else{
				var fileMap = {};
				this.modules.forEach(function(module) {
					
					if(module.resource){
						
						var index = module.resource.indexOf(options.filter);

						var name = module.resource.substr(index)

						if(index !=-1){
							
							
							if(module.id === null) {
								module.id = this.nextFreeModuleId++;
								
								module.name = name;
							}
							
							if(!module.name){
								module.name = name;
							}
							fileMap[module.name] = module.id;
							fileMap["max"] = module.id;
						}
						
						
					}

				}, this);

				function mkdirsSync(dirpath, mode) { 
				    if (!fs.existsSync(dirpath)) {
				        var pathtmp;
				        dirpath.split(path.sep).forEach(function(dirname) {
				            if (pathtmp) {
				                pathtmp = path.join(pathtmp, dirname);
				            }
				            else {
				            	if(!dirname){
				            		pathtmp = path.sep+dirname;
				            	}else{
				            		pathtmp = dirname;
				            	}
				                
				            }
				            if (!fs.existsSync(pathtmp)) {
				                if (!fs.mkdirSync(pathtmp, mode)) {
				                    return false;
				                }
				            }
				        });
				    }
				    return true; 
				}
				mkdirsSync(options.mapModulePath);
				
				if(fs.existsSync(options.mapModulePath+options.mapModuleFile)){
					 fs.unlinkSync(options.mapModulePath+options.mapModuleFile);
				}
				var batFileContentStr = JSON.stringify(fileMap);
				
				var buffer = new Buffer(batFileContentStr, "utf8");

				fs.writeFileSync(options.mapModulePath+options.mapModuleFile, buffer, 'utf8');
				
			}
			
		});
	});
};


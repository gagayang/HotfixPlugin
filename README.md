# HotfixPlugin
react hotfix plugin
##使用此插件可以 在webpack 打包时候 生成hotfix的 一个chunk文件 用来起到hotfix的作用

具体配置如下
###1 在生产环境下 
var hotFixPluginConfig =  {
          ,mapModulePath: path.join(options.root, "./dist/mapModuleFile")
          ,mapModuleFile:"/mapFile.js"
          ,filter:"src"
  }
new hotFixPlugin(hotFixPluginConfig)  
#####参数说明
  前两个参数就是保存的 文件地址和名称
  第三个参数为 过滤条件

###hotfix hotfix环境下 

    hotFixPluginConfig['target'] = 'hotfix';
    hotFixPluginConfig['hotfixFile'] = changeSet;
#####参数说明
    第一个参数表明要hotfix了
    第二个参数表示 我要hotfix那些文件。数组形式从src开始写起

    

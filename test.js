const QuickChartJs = require("./index")
const path = require('path')
const QuickChartJsInstance = new QuickChartJs()

QuickChartJsInstance.setIsRemote()
QuickChartJsInstance.setConfig({
  type: 'bar',
  data: {
    labels: ['January', 'February', 'March', 'April', 'May'],
    datasets: [{
      label: 'Dogs',
      data: [50, 60, 70, 180, 190]
    }, {
      label: 'Cats',
      data: [100, 200, 300, 400, 500]
    }]
  }
});

const FILE_NAME = "./test.png"
QuickChartJsInstance.toFile(path.join(__dirname,FILE_NAME))
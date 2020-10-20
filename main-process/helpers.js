const fs = require('fs')

module.exports = {
    jsonReader: function(filePath) {
        try {
            const jsonString = fs.readFileSync(filePath)
            const obj = JSON.parse(jsonString)
            return obj
          } catch(err) {
            console.log(err)
            return
          }
    }
}
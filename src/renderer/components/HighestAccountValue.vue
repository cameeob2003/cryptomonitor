<template>
  <div class="card">
    <div class="card-body">
      <p class="card-text text-center">Highest Value</p>
      <h5 class="card-title text-center">{{ format(value, 2) }}</h5>
      <p class="card-text text-muted text-center">
        <small>The highest value for your account was seen on {{ date }}</small>
      </p>
    </div>
  </div>
</template>

<script>
  const remote = require('electron').remote
  const app = remote.app
  let dataFolder = `${app.getPath('appData')}/cryptomonitor`
  let dataFile = `${dataFolder}/highest-account-value.json`
  let fs = require('fs')
  export default {
    name: 'highest-account-value',
    props: ['currentValue', 'bus'],
    data: function () {
      return {
        value: 0,
        date: null
      }
    },
    watch: {
      currentValue: function (newValue) {
        // check if the new value is higher than the old value
        if (newValue > this.getHighestSeenAccountValue()) {
          this.saveHighestSeenAccountValue(newValue)
        }
      }
    },
    mounted: function () {
      this.getHighestSeenAccountValue()
    },
    methods: {
      getHighestSeenAccountValue: function () {
        if (fs.existsSync(dataFile)) {
          let json = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
          this.value = json.value
          this.date = json.date
          this.bus.$emit('highest-account-value-update', json.value)
          return json.value
        }
        return 0
      },
      saveHighestSeenAccountValue: function (newValue) {
        // ensure that the data directory exists so we can save the values
        if (!fs.existsSync(dataFolder)) {
          fs.mkdirSync(dataFolder)
        }

        fs.writeFileSync(dataFile, JSON.stringify({
          value: newValue,
          date: this.currentDateString()
        }))

        this.value = newValue

        this.bus.$emit('highest-account-value-update', newValue)
      },
      format: function (amount, fraction = 0) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: fraction
        }).format(amount)
      },
      currentDateString: function () {
        let date = new Date()
        let options = {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }
        return date.toLocaleTimeString('en-us', options)
      }
    }
  }
</script>

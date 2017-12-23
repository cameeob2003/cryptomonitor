<template>
  <div class="container">
    <div class="row mt-4 mb-3">
      <div class="col">
        <img id="logo" class="mx-auto d-block" src="~@/assets/logo.png" alt="electron-vue">
      </div>
    </div>
    <div class="row">
      <div class="col text-muted">
        <p class="text-center">Last data update: <b><timeago v-if="time !== ''" :since="time" :auto-update="1"></timeago></b></p>
        <p class="text-center" v-if="currencies.length">Estimated account value: <b>{{ format(getAccountValue(), 2) }}</b></p>
      </div>
    </div>
    <div class="row mt-4">
      <div class="col-9">
        <div class="form">
          <div class="row">
            <div class="col">
              <select class="form-control mr-sm-3" id="selectedCurrency" v-model="ownedFormCurrency">
                <option disabled value="">Select a Currency</option>
                <option v-for="currency in currencies" v-bind:value="currency.id">{{ currency.symbol }}</option>
              </select>
              <small class="form-text text-muted">1) Select a currency you want to monitor.</small>
            </div>
            <div class="col">
              <input type="number" class="form-control mr-sm-3" placeholder="Owned amount" v-model="ownedFormAmount">
              <small class="form-text text-muted">2) Input the amount of the selected currency you currently own (optional).</small>
            </div>
            <div class="col">
              <button type="submit" class="btn btn-default" v-on:click="addOwnedAmount()">Monitor</button>
              <small class="form-text text-muted">3) Click "Monitor" and get all the live data... NomNomNom</small>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row mt-4">
      <div class="col">
          <table class="table table-striped table-dark">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Symbol</th>
                <th scope="col">Rank</th>
                <th scope="col">Market Cap</th>
                <th scope="col">Change% (24h)</th>
                <th scope="col">Price BTC</th>
                <th scope="col">Price USD</th>
                <th scope="col">Owned</th>
                <th scope="col">Value USD</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="currency in currencies" v-if="currency.isListed">
                <th scope="row">{{ currency.name }}</th>
                <td>{{ currency.symbol }}</td>
                <td>{{ currency.rank }}</td>
                <td>{{ format(currency.market_cap_usd) }}</td>
                <td v-if="currency.percent_change_24h >= 0" class="text-success">{{ currency.percent_change_24h }}%</td>
                <td v-if="currency.percent_change_24h < 0" class="text-danger">{{ currency.percent_change_24h }}%</td>
                <td>{{ currency. price_btc }}</td>
                <td>{{ format(currency.price_usd, 2) }}</td>
                <td>{{ getOwnedAmount(currency.id) }}</td>
                <td>{{ format(getOwnedAmount(currency.id) * currency.price_usd, 2) }}</td>
                <td><button class="btn btn-danger btn-sm" v-on:click="removeCurrency(currency.id)">X</button></td>
              </tr>
            </tbody>
          </table>
      </div>
    </div>
    <div class="row mt-4">
      <div class="col text-center">
        <small class="text-muted">
          All data is gathered from coinmarketcap.com.<br/>
          You (the end user) are held personally responsible for any trades you place based on information from this tool.<br/>
        </small>
      </div>
    </div>
  </div>
</template>

<script>
  const remote = require('electron').remote
  const app = remote.app
  let fs = require('fs')
  let axios = require('axios')
  let dataFolder = `${app.getPath('appData')}/cryptomonitor`
  let dataFile = `${dataFolder}/data.json`
  export default {
    name: 'Dashboard',
    data: function () {
      return {
        time: '',
        currencies: [],
        ownedFormCurrency: '',
        ownedFormAmount: 0,
        ownedCrypto: [],
        options: [],
        error: ''
      }
    },
    mounted: function () {
      // load the initial set of data we will be working with
      this.refreshAvailableCurrencies()

      // set an interval so that we update the data every 45 seconds (4x a minute)
      setInterval(function () { this.refreshAvailableCurrencies() }.bind(this), 45000)
    },
    methods: {
      loadOwnedCurrency: function () {
        if (fs.existsSync(dataFile)) {
          this.ownedCrypto = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
          this.ownedCrypto.map((crypto) => {
            this.setListed(crypto.id, true)
          })
        }
      },
      saveOwnedCurrency: function () {
        if (!fs.existsSync(dataFolder)) {
          fs.mkdirSync(dataFolder)
        }
        fs.writeFileSync(dataFile, JSON.stringify(this.ownedCrypto))
      },
      refreshAvailableCurrencies: function () {
        axios.get('https://api.coinmarketcap.com/v1/ticker/?limit=0')
          .then((response) => {
            if (!this.currencies.length) {
              this.currencies = response.data.reduce((result, currency) => {
                currency.isListed = false
                result.push(currency)
                return result
              }, [])

              // since this is the initial (re)load of the app we will load any saved owned currency settings
              this.loadOwnedCurrency()
            } else {
              this.currencies = response.data.reduce((result, currency) => {
                currency.isListed = this.isListed(currency.id)
                result.push(currency)
                return result
              }, [])
            }
            this.time = new Date().toISOString()
          })
          .catch(() => { this.error = 'Unable to fetch currency list.' })
      },
      isListed: function (currencyId) {
        return this.currencies.reduce((result, currency) => {
          if (currency.id === currencyId) { return currency.isListed }
          return result
        }, false)
      },
      setListed: function (currencyId, boolean = false) {
        this.currencies = this.currencies.reduce((result, currency) => {
          if (currency.id === currencyId) { currency.isListed = boolean }
          result.push(currency)
          return result
        }, [])
      },
      removeCurrency: function (currencyId) {
        this.deleteOwnedAmount(currencyId)
        this.setListed(currencyId, false)
      },
      addOwnedAmount: function () {
        if (this.ownedFormCurrency !== '') {
          // remove the crypto that is being added from the current list if it exists
          this.ownedCrypto = this.removeOwnedAmount(this.ownedFormCurrency)
          this.ownedCrypto.push({
            id: this.ownedFormCurrency,
            amount: this.ownedFormAmount
          })
          this.setListed(this.ownedFormCurrency, true)

          // write this.ownedCrypto to a file in the install directory
          this.saveOwnedCurrency()

          this.ownedFormCurrency = ''
          this.ownedFormAmount = 0
        } else {
          alert('Please select a currency.')
        }
      },
      deleteOwnedAmount: function (currencyId) {
        this.ownedCrypto = this.removeOwnedAmount(currencyId)
        this.saveOwnedCurrency()
      },
      removeOwnedAmount: function (currencyId) {
        return this.ownedCrypto.reduce((result, entry) => {
          if (entry.id !== currencyId) {
            result.push(entry)
          }
          return result
        }, [])
      },
      getOwnedAmount: function (currencyId) {
        let owned = this.ownedCrypto.filter((owned) => {
          return (currencyId === owned.id)
        })
        if (owned[0] !== undefined) {
          return owned[0].amount
        }
        return 0
      },
      getAccountValue: function () {
        return this.currencies.reduce((result, currency) => {
          return (this.getOwnedAmount(currency.id) * currency.price_usd) + result
        }, 0)
      },
      format: function (amount, fraction = 0) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: fraction
        }).format(amount)
      }
    }
  }
</script>

<style></style>

import React, { Component } from 'react'
import { withStyles } from '@material-ui/core/styles'
import Switch from '@material-ui/core/Switch'
import Web3 from 'web3'
import Onboard from 'bnc-onboard';
const SimpleNft = require('../contracts/SimpleNft.json')
const axios = require('axios')

const styles = {
  myNFTs: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  toggle: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '40px 0',
  },
  card: {
    backgroundColor: '#FFFFFF',
    display: 'flex',
    justifyContent: 'center',
    borderRadius: 6,
  },
  subtitle: {
    fontSize: 24,
  },
}

const ToggleSwitch = withStyles({
  switchBase: {
    color: '#000080',
    '&$checked': {
      color: '#f5bf05',
    },
    '&$checked + $track': {
      backgroundColor: '#ffffff',
    },
  },
  checked: {},
  track: {},
})(Switch);

let web3

const onboard = Onboard({
  dappId: '09a2db78-5c6a-4dad-b5f7-218b278d0e55', // [String] The API key created by step one above
  networkId: 5777, // [Integer] The Ethereum network ID your Dapp uses.
  subscriptions: {
    wallet: wallet => {
      web3 = new Web3(wallet.provider)
    }
  }
})

class MyNFTs extends Component {
  state = {
    web3: null,
    account: null,
    simpleNftContract: null,
  }

  componentDidMount = async () => {
    try {
      const account = (await web3.eth.getAccounts())[0]
      const networkId = await web3.eth.net.getId()
      const deployedNetwork = SimpleNft.networks[networkId]
      const simpleNftContract = new web3.eth.Contract(
          SimpleNft.abi,
          deployedNetwork && deployedNetwork.address,
      )
      this.setState({ web3, simpleNftContract, account })
      this.getMyNfts()
    } catch (error) {
      alert(
          `Failed to load web3, accounts, or contract. Check console for details.`,
      )
      console.error(error)
    }
  }

  getMyNfts = async() => {
    const { simpleNftContract, account } = this.state
    const tokensOfOwner = await simpleNftContract.methods.tokensOfOwner(account).call()
    console.log("tokensOfOwner", tokensOfOwner);

    const myNfts = await Promise.all(tokensOfOwner.map(async (tokenId) => {
      const tokenUri = await simpleNftContract.methods.tokenURI(tokenId).call()
      const { data } = await axios.get(tokenUri)
      return {
        ...data,
        tokenId,
        account
      };
    }))

    console.log("myNfts", myNfts);

    this.setState({
      ...this.state,
      tokensOfOwner,
      myNfts
    })
  }

  handleChange = () => {
    this.setState({
      ...this.state,
      checked: !this.state.checked
    })
  }

  render() {
    const { classes } = this.props

    return (
      <div className={classes.myNFTs}>
        <div className={classes.toggle}>
          <span>Borrowing</span>
          <ToggleSwitch
            checked={this.state.checked}
            onChange={this.handleChange}
            value="checked"
          />
          <span>Lending</span>
        </div>
        <div className={classes.card}>
          {this.state.checked? (
            <div className={classes.subtitle}>
              Lending
            </div>
            ) : (
            <div className={classes.subtitle}>
              Borrowing
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default withStyles(styles)(MyNFTs)


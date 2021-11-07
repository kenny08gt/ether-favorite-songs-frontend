import React from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/EtherFavoriteSongs.json";
import { getData, getPreview, getTracks } from 'spotify-url-info';

class App  extends React.Component {

 
  constructor(props) {
    super(props);
    this.contractAddress = "0x9F119C04BF39033D699f8Ab6bd8B93293eAA9dD4";
    this.contractABI = abi.abi;
  
    // const [currentAccount, setCurrentAccount] = useState("");
    this.state = {url: 'https://open.spotify.com/track/1zdsOgv1hdGGGe9CK1QPY7?si=0a7b6acefd8d4dc5',
    account: null,
    total: 0,
    mining: false,
    allSongs: [],
    userFound: false};
     this.handleChange = this.handleChange.bind(this);

    this.checkIfWalletIsConnected();
  }

  handleChange(event) {
    this.setState({url: event.target.value});
  }

  setCurrentAccount = (account) => {
    console.log(account);
    this.setState({ account: account });
  }

  getAllSongs = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const favoriteSongsPortalContract = new ethers.Contract(this.contractAddress, this.contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const songs = await favoriteSongsPortalContract.getAllSongs();

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let songsCleaned = [];
        songs.forEach(song => {
          // getPreview(song.url)
          // .then(data => console.log(data));
          // getData(song.url)
          // .then(data => console.log(data));
          songsCleaned.unshift({
            contributor: song.contributor,
            timestamp: (new Date(song.timestamp * 1000)).toLocaleDateString("en-US", options),
            url: song.url
          });
        });
        console.log(songsCleaned);

        /*
         * Store our data in React State
         */
        this.setState({
          allSongs: songsCleaned
        });
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  onNewSong = (from, timestamp, url) => {
    console.log('new song listener', from, timestamp, url);
    this.setState({
      allSongs: [ {
        address: from,
        timestamp: new Date(timestamp * 1000),
        url: url,
      }, ...this.state.allSongs]
    });
  };

  setupListener = () => {
     if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      let favoriteSongsPortalContract = new ethers.Contract(this.contractAddress, this.contractABI, signer);
      favoriteSongsPortalContract.on('NewSong', this.onNewSong);
    }
  }
   
  checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      
      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      
      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        this.setCurrentAccount(account);
        this.setState({
          userFound: true
        })
        this.getTotal();
        this.getAllSongs();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      this.setCurrentAccount(accounts[0]); 
      this.getTotal();
    } catch (error) {
      console.log(error)
    }
  }

  getTotal = async () => {
    console.log('get total');
    const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const favoriteSongsPortalContract = new ethers.Contract(this.contractAddress, this.contractABI, signer);

        let count = await favoriteSongsPortalContract.getTotalSongs();
        this.setState({total: count.toNumber()});
        console.log(this.state.total);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
  }
  
  wave = async () => {
     try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const favoriteSongsPortalContract = new ethers.Contract(this.contractAddress, this.contractABI, signer);

        let count = await favoriteSongsPortalContract.getTotalSongs();
        console.log("Retrieved total wave count...", count.toNumber());

                /*
        * Execute the actual wave from your smart contract
        */
        this.setState({ minign: true });
        const waveTxn = await favoriteSongsPortalContract.addSong(this.state.url, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        this.setState({ minign: false });

        count = await favoriteSongsPortalContract.getTotalSongs();
        console.log("Retrieved total wave count...", count.toNumber());
         this.getAllSongs();
         this.getTotal();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
       this.setState({ minign: false });
    }
  }
  
  render = ()=>{
    let buttonsClasses = "waveButton";
    if(this.state.minign) {
      buttonsClasses += " loading";
    }
  return (
    <div>
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        Hello there you human being with super good music taste
        </div>

        <div className="bio">
        Let's build something great together!. Add your favorite song in spotify. <br/>
        Let's build the greatest playlist of all time. Please add a valid spotify url.
        </div>
       
       {this.state.userFound && (
         <>
        <input type="url" name="url" value={this.state.url} onChange={this.handleChange} placeholder="link to the super cool song"/>
        <button className={buttonsClasses} onClick={this.wave}>
          Share my song to the blockchain!
        </button>
        </>
        )}
        {/*
        * If there is no currentAccount render this button
        */}
        {!this.state.account && (
          <button className="waveButton" onClick={this.connectWallet}>
            But first, Connect your Wallet
          </button>
        )}
        {this.state.minign && (
          <div>
          <br/><br/><br/>
          <strong>Please wait, the magic its happening</strong>
          <div><iframe src="https://giphy.com/embed/5HSYaZTcRpYnS" width="100%" height="100%" frameBorder="0" className="giphy-embed" allowFullScreen></iframe></div>
          <br/><br/><br/>
          </div>
        )}
        <div>
          <h2>Songs added: {this.state.total}</h2>
        </div>
         {this.state.allSongs.map((song, index) => {
          return (
            <div  key={index} >
              <div style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
                <table border="0">
                <tbody>
                  <tr>
                    <td>
                      <a href={song.url} target="_blank">
                       <div className="play-icon">
                       <img src="/play-icon.png" />
                       </div>
                      </a>
                    </td>
                    <td>                
                      <a href={song.url} target="_blank">
                        <div><strong>Added by:</strong> <small>{song.contributor}</small>  <strong>On:</strong> <small>{song.timestamp.toString()}</small>
                        </div>
                      </a>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>)
        })}
      </div>
    </div>
    <div className="mainContainer">
       <div className="credits">
       <h3>About</h3>
       <p>Blockchain app, using solidity and the ethereum blockchain to collect the most <br/> awesome music collection. Presented with react js and web3 js.</p>
       Hi, Im Alan Hurtarte, a Lead full stack developer with more than 5 years of <br />
       professional experiencie. This is my first web3 project. Made with 💙 from 🇬🇹 <br />  <a href="https://github.com/kenny08gt">Github</a> | <a href="https://twitter.com/alanhurtarte">Twitter</a> | <a href="https://www.linkedin.com/in/alanhurtarte/">Linkedin</a> <br/><br />
       Thanks to @_buildspace. <br />
      
      </div>
    </div>
    </div>
  );
  }
}

export default App;

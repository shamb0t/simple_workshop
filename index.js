import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import Playlists from './Playlists'
import Playlist from './Playlist'
import store from './PlaylistsStore'
import IPFS from 'ipfs'
import { BrowserRouter as Router, Route } from 'react-router-dom'
// import * as serviceWorker from './serviceWorker';

// ReactDOM.render(<Playlists store={store} />, document.getElementById('root'));
class App extends React.Component{
    async componentDidMount () {
      const ipfs = await IPFS.create({ repo: './ipfs-repo', EXPERIMENTAL: { pubsub: true }})
      await store.connect(ipfs)
    }

    render(){
        return(
          <Router>
              <Route path="/:address" component={(props) => <Playlist {...props} store={store}/> }></Route>
              <Route exact path="/" component={(props) => <Playlists {...props} store={store}/> }/>
          </Router>
        )
    }
}

ReactDOM.render(<App />, document.getElementById('root'))


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();

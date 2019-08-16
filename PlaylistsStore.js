import { observable } from 'mobx'
import Identities from 'orbit-db-identity-provider'
import OrbitDB from 'orbit-db'

class PlaylistsStore {
  @observable playlists = []
  @observable peers = []
  @observable isOnline = false

  constructor() {
    this._ipfs = null
    this.odb = null
  }

  async connect(ipfs, options = {}) {
    this._ipfs = ipfs
    const { id } = await ipfs.id()
    this.ipfsId = id
    const identity = options.identity || await Identities.createIdentity({ id: 'user' })
    this.odb = await OrbitDB.createInstance(ipfs, { identity, directory: './odb'})
    await this.load()
    console.log(this.playlists.all)
    this.isOnline = true
  }

  async load(key = 'playlists') {
    this.playlists = await this.odb.feed(this.odb.identity.id + 'playlists') //JSON.parse(localStorage.getItem(key)) || []
    await this.playlists.load()
  }

  async deletePlaylist(hash) {
    // const filtered = this.playlists.filter(x => x.name !== name)
    // this.playlists = filtered
    // this.save()
    return this.playlists.del(hash)
  }

  async createNewPlaylist(name) {
    const playlist = await this.odb.feed(name, { accessController: { type: 'orbitdb', write: [this.odb.identity.id]}})
    const p = {
      name,
      address: playlist.address.toString()
    }

    this.playlists.add(p)
    return name
  }

  async joinPlaylist (address) {
    if (!this.odb) return null
    const playlist = this.odb.stores[address] || await this.odb.open(address)
    await playlist.load()
    return playlist
  }

  async addFile (address, source) {
    if (!source || (!source.filename && !source.directory)) {
      throw new Error('Filename or directory not specified')
    }
    const isBuffer = source.buffer && source.filename
    const name = source.directory
      ? source.directory.split('/').pop()
      : source.filename.split('/').pop()
    const size = source.meta && source.meta.size ? source.meta.size : 0

    const result = await this._ipfs.add(Buffer.from(source.buffer))
    const hash = result[0].hash

    console.log("upload", hash)

    // Create a post
    const data = {
      content: hash,
      meta: Object.assign(
        {
          from: this.odb.identity.id,
          type: 'file',
          ts: new Date().getTime()
        },
        { size, name },
        source.meta || {}
      )
    }

    return this.addToPlaylist(address, data)
}

  async addToPlaylist (address, data) {
    const feed = this.odb.stores[address] || await this.odb.open(address)
    if (feed) {
      const hash = await feed.add(data)
      return feed.get(hash)
    }
    return
  }

  async _sendFile (file, address) {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = async event => {
        const f = await this.addFile(address,
          {
            filename: file.name,
            buffer: event.target.result,
            meta: { mimeType: file.type, size: file.size }
          })
        resolve(f)
      }
      reader.readAsArrayBuffer(file)
    })
  }

  sendFiles (files, address) {
    const promises = []
    for (let i = 0; i < files.length; i++) {
      promises.push(this._sendFile(files[i], address))
    }
    return Promise.all(promises)
  }

  async sharePlaylist (address, peer) {
    // add peer to ac
    // send message to peer
    // if (!this.odb) return false
    // const feed = this.odb.stores[address] || await this.odb.open(address)
    // await feed.access.grant('write', peer)
    // return true
    console.log(address, peer)
    // const channel = await Channel.open(this._ipfs, peer)
    // // Explicitly wait for peers to connect
    // console.log("Channel", channel)
    // await channel.connect()
    // // Send message on the channel
    // const thing = await channel.send('Hello World!')
    // console.log(thing)
    // // Process messages from the other peer
    // channel.on('message', (message) => {
    //   console.log('Message from', message.from, message)
    // })
  }
}

const store = window.store = new PlaylistsStore

// store.load()

export default store

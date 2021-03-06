import React, { Component } from "react";
import InfiniteScroll from "react-infinite-scroller";
// imports for OnsenUI
import * as Ons from "react-onsenui"; // Import everything and use it as 'Ons.Page', 'Ons.Button'
//import * as ons from "onsenui"; // This needs to be imported to bootstrap the components.
// Webpack CSS import
import "onsenui/css/onsenui.css";
import "onsenui/css/onsen-css-components.css";

class UserFeed extends Component {
  // inherits the posts to show from the TabContainer.jsx
  constructor(props) {
    super(props);
    this.state = {
      foo: true
    };
  }

  // called from PullHook when the action is performed
  async onLoad(done) {
    await this.props.fetchAllSounds();
    // await setTimeout(() => done(), 3000);
    // ^^^^ Kan användas för att testa hur olika laddningsalternativ ser ut.
    done();
  }

  // Used to request a new database query
  renderPullHook() {
    return (
      <Ons.PullHook
        onChange={this.onChange}
        onLoad={this.onLoad.bind(this)} // bind this (the Feed.jsx object) to be able to use its methods and attributes
      >
        {this.state.pullHookState === "initial" ? (
          <span>
            <Ons.Icon size={35} spin={false} icon="ion-arrow-down-a" />
            Pull down to refresh
          </span>
        ) : this.state.pullHookState === "preaction" ? (
          <span>
            <Ons.Icon size={35} spin={false} icon="ion-arrow-up-a" />
            Release to refresh
          </span>
        ) : (
          <span>
            <Ons.Icon
              spin
              icon="sync-alt"
              style={{ display: this.state.spinner }}
            />
          </span>
        )}
      </Ons.PullHook>
    );
  }

  // https://www.npmjs.com/package/react-infinite-scroller
  renderInfiniteScroller() {
    let items = [];
    this.props.allSounds.map((element, i) => {
      items.push(this.renderItem(element));
    });
    return (
      <InfiniteScroll
        pageStart={0}
        loadMore={this.loadItems.bind(this)}
        initialLoad={false} // undviker att ladda när elementet först skapas iom att vi redan har data
        hasMore={this.props.hasMore}
        loader={
          <div className="loader" key={0}>
            Loading ...
          </div>
        }
        // threshold = {1000}     // <---- om man vill sätta anpassad gräns för när den uppdaterar
        useWindow={false} // <---- MUY IMPORTANTE, annars känner den inte av scrollen
      >
        <div>{items}</div>
      </InfiniteScroll>
    );
  }

  // The function called from infiniteScroller when new items are to be loaded
  loadItems(page) {
    //console.log("Loading more items from the database");
    this.props.fetchAdditionalSounds();
  }

  // Each element to be shown in the feed
  renderItem(item) {
    let img = item.imgUrl ? item.imgUrl : "https://i.imgur.com/dBmYY4M.png"; // old placeholder image "https://i.imgur.com/hgyXyww.png"
    return (
      <Ons.Card key={item.time}>
        <p>{item.title}</p>
        <p>Posted by: {item.userName}</p>
        <center>
          <img src={img} alt="placeholderText" />
          <audio controls onWaiting={() => this.handleAudioWaiting()}>
            <source src={item.url} />
            <p>
              Your browser does not support audio. The file can be found at{" "}
              <a href={item.url}>this link</a>
            </p>
          </audio>
        </center>
        <p>
          {new Date(item.time).toDateString()}{" "}
          {new Date(item.time).toLocaleTimeString()}
        </p>
      </Ons.Card>
    );
  }

  // Called if the audio player has to wait due to slow internet connection
  handleAudioWaiting() {
    this.props.createErrorMessage(
      "Slow internet connection detected.",
      "Toast"
    );
  }

  render() {
    return (
      <Ons.Page>
        {this.renderPullHook()}
        <button onClick={() => this.props.fetchUsersPosts()}>fetch</button>
        {this.renderInfiniteScroller()}
      </Ons.Page>
    );
  }
}

export default UserFeed;

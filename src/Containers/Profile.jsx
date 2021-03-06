import React, { Component } from "react";
import ShowUsersPosts from "./ShowUsersPosts";
//import { redirectWhenOAuthChanges } from "../utils";

import * as firebase from "firebase/app";
import "firebase/auth";
import "firebase/storage";
import "firebase/firestore";
import "firebase/functions";

import * as Ons from "react-onsenui"; // Import everything and use it as 'Ons.Page', 'Ons.Button'
import * as ons from "onsenui"; // This needs to be imported to bootstrap the components.

// Webpack CSS import
import "onsenui/css/onsenui.css";
import "onsenui/css/onsen-css-components.css";

class Profile extends Component {
  // behövde skriva om koden med en konstruktor för att få tillgång till props
  constructor(props) {
    super(props);
    this.state = {
      currentUser: null,
      name: null,
      photoURL: null,
      image: "",
      checkmark: "none",
      spinner: "none",
      selectText: "inherent",
      uploadText: "inherent",
      deletingUser: false,
      listOfPosts: []
    };

    this.removeUser = firebase.functions().httpsCallable("removeUser");
  }

  componentDidMount() {
    this.firebaseAuthListener = firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.setState({ currentUser: user });
      }
    });

    var storage = firebase.app().storage("gs://soundy-dm2518.appspot.com/");
    this.storageRef = storage.ref();
    this.db = firebase.firestore();
  }

  componentWillUnmount() {
    this.firebaseAuthListener && this.firebaseAuthListener();
  }

  //Loggar ut användaren
  signOut = () => {
    firebase
      .auth()
      .signOut()
      .then(function() {
        //console.log("Signed out completed");
      })
      .catch(function(error) {
        console.log("Error when signing out" + error);
        this.props.createErrorMessage(
          "Error when signing out. See log for more details",
          "AlertDialog"
        );
      });
  };

  showRemoveAccountConfirmation = () => {
    ons.notification
      .confirm("Are you sure you want to delete your account?")
      .then(selected => {
        //Selected is 1 for OK and 0 for Cancel
        if (selected) {
          this.removeAccount();
        }
      });
  };

  removeAccount = () => {
    this.setState({ deletingUser: true });
    const { uid } = this.state.currentUser;
    console.log(uid);
    this.removeUser({ uid }).then(result => {
      if (result.data.completed) {
        this.signOut();
      } else {
        this.props.createErrorMessage("Error when removing account", "Toast");
      }
    });
  };

  //Set a profile image if the user created account with email+password
  renderProfileImage() {
    const currentUser = this.state.currentUser;
    if (currentUser && currentUser.photoURL === null) {
      //console.log(currentUser.userName);
      return (
        <img
          src="https://t4.ftcdn.net/jpg/02/15/84/43/240_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg"
          alt="No Display Name"
          className="userPhoto"
        />
      );
    } else {
      return (
        <img
          src={currentUser && currentUser.photoURL}
          alt={currentUser && currentUser.displayName}
          className="userPhoto"
        />
      );
    }
  }

  //Upload a new displayname to firebase
  editProfileName() {
    var user = firebase.auth().currentUser;
    this.state.name !== null &&
      user
        .updateProfile({
          displayName: this.state.name
        })
        .then(test => {
          this.setState({ currentUser: user, name: null });
        })
        .catch(function(error) {
          console.error("Error updating! " + error.code + " " + error.message);
          this.createErrorMessage(
            "Error editing profile. See log for more details",
            "AlertDialog"
          );
        });
  }

  //Upload and edit profile imgae
  upload = () => {
    var user = firebase.auth().currentUser;
    const ref = this.storageRef.child("profileImages");
    const file = document.querySelector("#photo").files[0];
    if (file) {
      this.setState({ uploadText: "none", spinner: "block" });
      const name = user.uid;
      const metadata = {
        contentType: file.type
      };
      const task = ref.child(name).put(file, metadata);
      task
        .then(snapshot => snapshot.ref.getDownloadURL())
        .then(url => {
          user
            .updateProfile({
              photoURL: url
            })
            .then(test => {
              this.setState({
                currentUser: user,
                image: null,
                checkmark: "none",
                spinner: "none",
                selectText: "block",
                uploadText: "block"
              });
            })
            .catch(function(error) {
              // An error happened.
              this.props.createErrorMessage(
                "Error uploading profile image.",
                "AlertDialog"
              );
            });
        })
        .catch(console.error);
    }
  };

  //A function to chnage state of button-content when the user clicks on upload image
  selectButtonContent = () => {
    this.setState({
      checkmark: "block",
      selectText: "none"
    });
  };

  render() {
    const currentUser = this.state.currentUser;
    if (this.state.deletingUser) {
      return (
        <div style={{ paddingTop: "50%", fontSize: "2rem" }}>Deleting...</div>
      );
    }

    return (
      <Ons.Page className="page">
        <div className="top">
          <div className="profilDetails">
            <div className="profileNameAndImageContainer">
              {this.renderProfileImage()}
              <h2>{currentUser && currentUser.displayName}</h2>
            </div>
            <div className="signOutRemoveContainer">
              <Ons.Button modifier="material" onClick={this.signOut}>
                Sign out <Ons.Icon icon="sign-out-alt" />
              </Ons.Button>
              <Ons.Button
                modifier="material"
                onClick={this.showRemoveAccountConfirmation}
              >
                Remove account <Ons.Icon icon="trash" />
              </Ons.Button>
            </div>
            <div className="edit">
              <div className="editName">
                <Ons.Input
                  value={this.state.name}
                  onChange={event => {
                    this.setState({ name: event.target.value });
                  }}
                  modifier="underbar"
                  float
                  placeholder="Update Name"
                  className="updateName"
                  requried
                />
                <Ons.Fab
                  className="squareButton"
                  onClick={this.editProfileName.bind(this)}
                >
                  <Ons.Icon icon="save" />
                </Ons.Fab>
              </div>
              <form>
                <input
                  className="uploadImage"
                  type="file"
                  name="photo"
                  accept="image/*"
                  id="photo"
                  onChange={this.selectButtonContent}
                />
                <label htmlFor="photo" className="uploadImage">
                  <span style={{ display: this.state.selectText }}>
                    Select Image
                  </span>
                  <Ons.Icon
                    icon="check"
                    style={{ display: this.state.checkmark }}
                  />
                </label>
                <Ons.Button
                  modifier="material"
                  onClick={this.upload}
                  className="uploadImage rightButton"
                >
                  <span style={{ display: this.state.uploadText }}>Upload</span>
                  <Ons.Icon
                    spin
                    icon="sync-alt"
                    style={{ display: this.state.spinner }}
                  />
                </Ons.Button>
              </form>
            </div>
          </div>
        </div>
        <ShowUsersPosts
          user={this.state.currentUser}
          shouldShowDeleteButton={true}
        />
      </Ons.Page>
    );
  }
}

export default Profile;

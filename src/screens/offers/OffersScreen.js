import React, { Component } from "react";
import { firestore } from "../../Firebase";
// StyleSheets
import { Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Offer } from "../../components/Offer";
import Loader from "../../components/Loader";
// StyleSheets
import "bootstrap/dist/css/bootstrap.min.css";

export default class OffersScreen extends Component {
  constructor() {
    super();
    this.state = {
      loading: true,
    };
  }

  componentDidMount() {
    let temp = [];
    firestore
      .collection("offers")
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
        const changes = snapshot.docChanges();
        changes.forEach((change) => {
          const document = change.doc;
          const documentData = document.data();
          var now = parseInt((Date.now() / 1000).toFixed(0));
          var changeType = change.type;
          var gotBought = documentData.bought !== undefined;

          if (changeType === "added") {
            if (documentData.expiresAt.seconds > now && !gotBought) {
              documentData.id = document.id;
              temp.push(documentData);
            }
          } else if (changeType === "removed") {
            temp = temp.filter((offer) => {
              return offer.id !== document.id;
            });
          } else if (changeType === "modified") {
            temp = temp.filter((offer) => {
              return offer.id !== document.id;
            });
            temp.push(documentData);
          }
        });
        this.setState({ offers: temp, loading: false });
      });
  }

  render() {
    const { loading, offers } = this.state;

    if (loading) {
      return <Loader />;
    } else {
      return (
        <section>
          <div>
            <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
              {offers.length > 0 ? (
                offers.map((offer, index) => {
                  return (
                    <Col
                      xs={12}
                      md={6}
                      lg={6}
                      xl={3}
                      key={index}
                      className={(offers.lenth < 4 && "mb-md-0", "mb-3 px-0 px-md-3")}
                    >
                      <div>
                        <Link to={`/Angebot/${offer.id}`} style={{ textDecoration: "none" }}>
                          <Offer
                            deletable={false}
                            type={offer.type}
                            thumbnail={offer.images.thumbnail}
                            name={offer.name}
                            description={offer.description}
                            price={offer.price}
                          />
                        </Link>
                      </div>
                    </Col>
                  );
                })
              ) : (
                <div className="bg-light mx-auto px-4 py-3 rounded">
                  <h3 className="font-weight-bold text-center mb-0">Keine Angebote gefunden</h3>
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }
  }
}

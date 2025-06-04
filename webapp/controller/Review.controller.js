sap.ui.define(["sap/ui/core/mvc/Controller"], (Controller) => {
  "use strict";

  return Controller.extend("ui5.odata.test.controller.Review", {
    onInit() {
      const oRouter = this.getOwnerComponent().getRouter();
      oRouter
        .getRoute("review")
        .attachPatternMatched(this._onObjectMatched, this);
    },

    _onObjectMatched(oEvent) {
      const sBookId = window
        .decodeURIComponent(oEvent.getParameter("arguments").bookId)
        .match(/\(([^)]+)\)/)[1];
      this.getView().bindElement({
        path:
          "/" +
          window.decodeURIComponent(oEvent.getParameter("arguments").bookId),
        model: "bookItems",
      });
      this._filterReviews(sBookId);
    },

    _filterReviews: function (sBookId) {
      var oList = this.byId("reviewList");
      var oBinding = oList.getBinding("items");

      if (oBinding) {
        // Create filter - adjust the property name based on your OData service
        var oFilter = new sap.ui.model.Filter(
          "book_ID",
          sap.ui.model.FilterOperator.EQ,
          sBookId
        );
        oBinding.filter([oFilter]);
      }
    },
  });
});

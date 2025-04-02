import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="test"
export default class extends Controller {
  connect() {
    console.log("TestController connected")
  }

  greet() {
    console.log("TestController greet method called")
    this.element.textContent = "Hello from Stimulus!"
  }
}


package me.mouse.tmblockly;

import java.util.Optional;

import javafx.application.Application;
import javafx.event.EventHandler;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.scene.control.TextInputDialog;
import javafx.scene.control.Alert.AlertType;
import javafx.scene.web.PromptData;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebEvent;
import javafx.scene.web.WebView;
import javafx.stage.Stage;
import javafx.util.Callback;

public class TMBlockly extends Application {

	@Override
	public void start(Stage primaryStage) throws Exception {
		
		WebView browser = new WebView();
		WebEngine webEngine = browser.getEngine();
		
		webEngine.load(TMBlockly.class.getResource("index.html").toExternalForm());
		webEngine.setOnAlert(new EventHandler<WebEvent<String>>() {
			
			@Override
			public void handle(WebEvent<String> event) {
				Alert alert = new Alert(AlertType.INFORMATION, event.getData());
				alert.setTitle(event.getData());
				alert.setHeaderText(null);
				alert.showAndWait();
			}
		});
		webEngine.setConfirmHandler(new Callback<String, Boolean>() {
			
			@Override
			public Boolean call(String arg0) {
				Alert alert = new Alert(AlertType.CONFIRMATION, arg0);
				alert.setTitle(arg0);
				alert.setHeaderText(null);
				return alert.showAndWait().get()==ButtonType.OK;
			}
		});
		webEngine.setPromptHandler(new Callback<PromptData, String>() {
			
			@Override
			public String call(PromptData param) {
				TextInputDialog dialog = new TextInputDialog(param.getDefaultValue());
				dialog.setContentText(param.getMessage());
				dialog.setTitle(param.getMessage());
				dialog.setHeaderText(null);
				Optional<String> arg = dialog.showAndWait();
				return arg.isPresent()?arg.get():"";
			}
		});
		
		Scene scene = new Scene(browser, 1080, 720);
		primaryStage.setScene(scene);
		primaryStage.setTitle("TMBlockly");
		primaryStage.show();
	}

	public static void main(String[] args) {
		launch(args);
	}
}

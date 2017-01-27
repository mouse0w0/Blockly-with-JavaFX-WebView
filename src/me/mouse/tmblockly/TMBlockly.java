
package me.mouse.tmblockly;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Optional;

import javafx.application.Application;
import javafx.concurrent.Worker.State;
import javafx.geometry.HPos;
import javafx.geometry.VPos;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.scene.control.TextInputDialog;
import javafx.scene.control.ToolBar;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;
import javafx.scene.control.Alert.AlertType;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import javafx.stage.Stage;
import netscape.javascript.JSObject;

public class TMBlockly extends Application {
	
	ToolBar toolbar;
	BlocklyBrowser blocklyBrowser;

	@Override
	public void start(Stage primaryStage) throws Exception {
		VBox root = new VBox();
		root.setPrefHeight(Region.USE_COMPUTED_SIZE);
		root.setPrefWidth(Region.USE_COMPUTED_SIZE);
		
		toolbar = new ToolBar();
		root.getChildren().add(toolbar);
		
		blocklyBrowser = new BlocklyBrowser();
		root.getChildren().add(blocklyBrowser);
		
		Scene scene = new Scene(root);
		primaryStage.setScene(scene);
		primaryStage.setTitle("TMBlockly");
		primaryStage.show();
		
		primaryStage.setOnCloseRequest(event->{
    	JSObject win = (JSObject) blocklyBrowser.getWebEngine().executeScript("window");
    	win.setMember("tmb", new JSInterface());
    	blocklyBrowser.getWebEngine().executeScript("tmb.save(Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace)));");
		});

	}

	public static void main(String[] args) {
		launch(args);
	}
	
	public static String load(File file){
		if(!file.exists()) return "";
		
		StringBuilder builder = new StringBuilder();
		
		return builder.toString();
	}
	
	public static void save(File file,String str){
		if(!file.getParentFile().exists()) file.getParentFile().mkdirs();
		
		if(!file.exists())
			try {
				file.createNewFile();
			} catch (IOException e) {
				e.printStackTrace();
			}
		
		FileWriter writer = null;
		try {
			writer = new FileWriter(file);
			writer.write(str);
		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			if(writer!=null)
				try {
					writer.close();
				} catch (IOException e) {}
		}
	}
	
	public static class BlocklyBrowser extends Region {
		private WebView browser;
		private WebEngine webEngine;

		public WebEngine getWebEngine() {
			return webEngine;
		}

		public BlocklyBrowser() {
			browser = new WebView();
			browser.setMaxHeight(720);
			browser.setMaxWidth(1080);
			webEngine = browser.getEngine();

			webEngine.setUserDataDirectory(new File(""));
			webEngine.getLoadWorker().stateProperty().addListener((ov, oldState, newState) -> {
				if (newState == State.SUCCEEDED) {
					JSObject win = (JSObject) webEngine.executeScript("window");
					win.setMember("tmb", new JSInterface());
					webEngine.executeScript(
							"BlocklyStorage.loadXml_(\"<xml xmlns=\\\"http://www.w3.org/1999/xhtml\\\"><block type=\\\"controls_if\\\" id=\\\"GB7b`T-8wmV_his#6yG8\\\" x=\\\"200\\\" y=\\\"150\\\"></block></xml>\",workspace);");
				}
			});
			webEngine.setOnAlert(event -> {
				Alert alert = new Alert(AlertType.INFORMATION, event.getData());
				alert.setTitle(event.getData());
				alert.setHeaderText(null);
				alert.showAndWait();
			});
			webEngine.setConfirmHandler(arg0 -> {
				Alert alert = new Alert(AlertType.CONFIRMATION, arg0);
				alert.setTitle(arg0);
				alert.setHeaderText(null);
				return alert.showAndWait().get() == ButtonType.OK;
			});
			webEngine.setPromptHandler(param -> {
				TextInputDialog dialog = new TextInputDialog(param.getDefaultValue());
				dialog.setContentText(param.getMessage());
				dialog.setTitle(param.getMessage());
				dialog.setHeaderText(null);
				Optional<String> arg = dialog.showAndWait();
				return arg.isPresent() ? arg.get() : "";
			});

			webEngine.load(TMBlockly.class.getResource("index.html").toExternalForm());

			getChildren().add(browser);
		}

		@Override
		protected void layoutChildren() {
			double w = getWidth();
			double h = getHeight();
			layoutInArea(browser, 0, 0, w, h, 0, HPos.CENTER, VPos.CENTER);
		}

		@Override
		protected double computePrefWidth(double height) {
			return 1080;
		}

		@Override
		protected double computePrefHeight(double width) {
			return 720;
		}
	}
	
	public static class JSInterface{
		public void save(String xml){
			System.out.println(xml);
		}
	}
}

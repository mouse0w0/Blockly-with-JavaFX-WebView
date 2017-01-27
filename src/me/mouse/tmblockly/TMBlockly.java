
package me.mouse.tmblockly;

import java.io.BufferedReader;
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
import javafx.scene.control.Alert.AlertType;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import javafx.stage.Stage;
import netscape.javascript.JSObject;

public class TMBlockly extends Application {
	
	static final File DEFAULT_SAVE_PATH = new File(System.getProperty("user.dir"),"newblock.xml");
	BlocklyBrowser blocklyBrowser;

	@Override
	public void start(Stage primaryStage) throws Exception {
		blocklyBrowser = new BlocklyBrowser();
		
		Scene scene = new Scene(blocklyBrowser);
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
	
	public static String loadAll(File file){
		if (!file.exists())
			return "";

		StringBuilder builder = new StringBuilder();
		BufferedReader reader = null;
		try {
			reader = new BufferedReader(new FileReader(file));
			String line = null;
			while ((line = reader.readLine()) != null) {
				builder.append(line+"\r\n");
			}
		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			if (reader != null)
				try {
					reader.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
		}
		
		
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
	
	public class BlocklyBrowser extends Region {
		private ToolBar toolbar;
		private WebView browser;
		private WebEngine webEngine;

		public WebEngine getWebEngine() {
			return webEngine;
		}

		public BlocklyBrowser() {
			toolbar = new ToolBar();
			getChildren().add(toolbar);
			
			browser = new WebView();
			webEngine = browser.getEngine();

			webEngine.setUserDataDirectory(new File(""));
			webEngine.getLoadWorker().stateProperty().addListener((ov, oldState, newState) -> {
				if (newState == State.SUCCEEDED) {
			    	JSObject win = (JSObject) blocklyBrowser.getWebEngine().executeScript("window");
			    	win.setMember("txml", TMBlockly.loadAll(DEFAULT_SAVE_PATH));
					webEngine.executeScript(
							"BlocklyStorage.loadXml_(txml,workspace);");
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
	        double tbHeight = toolbar.prefHeight(w);
	        layoutInArea(toolbar,0,0,w,tbHeight,0,HPos.CENTER,VPos.CENTER);
	        layoutInArea(browser,0,tbHeight,w,h-tbHeight,0,HPos.CENTER,VPos.CENTER);
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
	
	public class JSInterface{
		public void save(String xml){
			TMBlockly.save(DEFAULT_SAVE_PATH, xml);
		}
	}
}

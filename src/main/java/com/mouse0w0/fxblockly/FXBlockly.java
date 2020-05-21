
package com.mouse0w0.fxblockly;

import com.mouse0w0.fxblockly.util.FileUtils;
import javafx.application.Application;
import javafx.concurrent.Worker.State;
import javafx.geometry.HPos;
import javafx.geometry.VPos;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.Alert.AlertType;
import javafx.scene.control.ButtonType;
import javafx.scene.control.TextInputDialog;
import javafx.scene.layout.Region;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import javafx.stage.Stage;
import netscape.javascript.JSObject;

import java.io.File;
import java.util.Optional;

public class FXBlockly extends Application {

    static final File DEFAULT_SAVE_PATH = new File(System.getProperty("user.dir"), "blocks.xml");

    private File savePath;

    public File getSavePath() {
        return savePath;
    }

    public void setSavePath(File savePath) {
        this.savePath = savePath;
    }

    public FXBlockly() {
        this(DEFAULT_SAVE_PATH);
    }

    public FXBlockly(File savePath) {
        this.savePath = savePath;
    }

    private BlocklyBrowser blocklyBrowser;

    @Override
    public void start(Stage primaryStage) throws Exception {
        blocklyBrowser = new BlocklyBrowser();
        blocklyBrowser.getWebEngine().getLoadWorker().stateProperty().addListener((ov, oldState, newState) -> {
            if (newState == State.SUCCEEDED) {
                blocklyBrowser.domToWorkspace(savePath);
            }
        });

        Scene scene = new Scene(blocklyBrowser);
        primaryStage.setOnCloseRequest(event -> {
            blocklyBrowser.save(savePath);
            System.out.println(blocklyBrowser.workspaceToDom());
        });
        primaryStage.setScene(scene);
        primaryStage.setTitle("FXBlockly");
        primaryStage.show();
    }

    public static void main(String[] args) {
        launch(args);
    }

    public class BlocklyBrowser extends Region {
        private WebView browser;
        private WebEngine webEngine;

        public WebEngine getWebEngine() {
            return webEngine;
        }

        public BlocklyBrowser() {
            browser = new WebView();
            webEngine = browser.getEngine();

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
                return alert.showAndWait().orElse(ButtonType.CANCEL) == ButtonType.OK;
            });
            webEngine.setPromptHandler(param -> {
                TextInputDialog dialog = new TextInputDialog(param.getDefaultValue());
                dialog.setContentText(param.getMessage());
                dialog.setTitle(param.getMessage());
                dialog.setHeaderText(null);
                Optional<String> arg = dialog.showAndWait();
                return arg.orElse("");
            });
            //防止网页跳转
            webEngine.locationProperty().addListener((obs, oldValue, newValue) -> {
                if (newValue.equals("index.html")) return;
                webEngine.load(FXBlockly.class.getResource("/index.html").toExternalForm());
            });

            webEngine.load(FXBlockly.class.getResource("/index.html").toExternalForm());

            getChildren().add(browser);
        }

        @Override
        protected void layoutChildren() {
            layoutInArea(browser, 0, 0, getWidth(), getHeight(), 0, HPos.CENTER, VPos.CENTER);
        }

        @Override
        protected double computePrefWidth(double height) {
            return 1080;
        }

        @Override
        protected double computePrefHeight(double width) {
            return 720;
        }

        public void save(File file) {
            FileUtils.save(file, workspaceToDom());
        }

        public String workspaceToDom() {
            return (String) getWebEngine().executeScript("Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));");
        }

        public void domToWorkspace(File file) {
            domToWorkspace(FileUtils.loadAllString(file));
        }

        public void domToWorkspace(String dom) {
            JSObject win = (JSObject) blocklyBrowser.getWebEngine().executeScript("window");
            win.setMember("txml", dom);
            webEngine.executeScript("Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(txml), workspace);");
        }
    }
}

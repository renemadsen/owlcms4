package app.owlcms.components;

import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.html.Paragraph;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.FlexComponent.JustifyContentMode;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;

@SuppressWarnings("serial")
public class ConfirmationDialog extends Dialog {
	
	public ConfirmationDialog(String title, String question, String confirmation, Runnable action) {
		Dialog dialog = this;
		dialog.setCloseOnEsc(false);
		dialog.setCloseOnOutsideClick(false);

		VerticalLayout content = new VerticalLayout();
		H3 title1 = new H3(title);
		title1.getStyle().set("margin-top", "0px");
		title1.getStyle().set("padding-top", "0px");
		
		Paragraph paragraph = new Paragraph();
		paragraph.getElement().setProperty("innerHTML", question);
		content.add(
			title1,
			paragraph
			);
		
		HorizontalLayout buttons = new HorizontalLayout();
		Button confirmButton = new Button("Confirm", event -> {
			action.run();
			Notification.show(confirmation);
			dialog.close();
		});
		confirmButton.getElement().setAttribute("theme", "primary");
		
		Button cancelButton = new Button("Cancel", event -> {
		    dialog.close();
		});
		cancelButton.getElement().setAttribute("theme", "primary error");
		cancelButton.focus();
		buttons.add(confirmButton, cancelButton);
		buttons.setWidthFull();
		buttons.setJustifyContentMode(JustifyContentMode.CENTER);
		
		dialog.add(content);
		dialog.add(buttons);
		
	}
}
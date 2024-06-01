package com.github.appreciated.css.grid.sizes;

import com.github.appreciated.css.grid.interfaces.AutoRowAndColUnit;
import com.github.appreciated.css.grid.interfaces.TemplateRowsAndColsUnit;

public class FitContent implements TemplateRowsAndColsUnit, AutoRowAndColUnit {
	public static String FUNCTION_NAME = "fit-content";
	private Length size;

	public FitContent(Length size) {
		this.size = size;
	}

	@Override
	public String getPrefixValue() {
		return FUNCTION_NAME + "(";
	}

	@Override
	public String getSuffixValue() {
		return ")";
	}

	@Override
	public String getValue() {
		return this.size.getCssValue();
	}

	@Override
	public boolean hasPrefix() {
		return true;
	}

	@Override
	public boolean hasSuffix() {
		return true;
	}

}

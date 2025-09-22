package com.klu.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.klu.model.MenusManager;

@RestController
@CrossOrigin
@RequestMapping("/menus")
public class MenusController {
	
	@Autowired
	MenusManager MM;
	
	@PostMapping("/getmenusbyrole")
	public String getMenusByRole(@RequestBody Map<String, String> data)
	{
		return MM.getMenusByRole(data.get("csrid"));
	}
}

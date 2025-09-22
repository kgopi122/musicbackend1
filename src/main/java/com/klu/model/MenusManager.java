package com.klu.model;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.gson.GsonBuilder;
import com.klu.repository.MenusRepository;
import com.klu.repository.jobportalrepo;

@Service
public class MenusManager {
	
	@Autowired
	MenusRepository MR;
	
	@Autowired
	JWTManager JM;
	
	@Autowired
	jobportalrepo JR;
	
	public String getMenusByRole(String token)
	{
		String email = JM.validateToken(token);
		if(email.compareTo("401") == 0)
			return "401::Token Expired";
		
		Users U =JR.findById(email).get();
		List<Menus> menulist = MR.findByRole(U.getRole());
		return new GsonBuilder().create().toJson(menulist).toString();
	}
	
	
}

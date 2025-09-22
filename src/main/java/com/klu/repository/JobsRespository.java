package com.klu.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.klu.model.Jobs;
@Repository
public interface JobsRespository extends JpaRepository<Jobs, Long> {
	
	
	
	

}

package com.klu.repository;

import com.klu.model.Songs;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SongRepository extends JpaRepository<Songs, Long> {

    List<Songs> findByGenre(String genre);

    List<Songs> findByMovieName(String movieName);

    List<Songs> findByArtist(String artist);
}

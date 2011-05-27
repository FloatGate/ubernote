package models;

import javax.persistence.Entity;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;

import play.db.jpa.Model;

@Entity
public class Note extends Model {
	public String name;
	public String contents;
	public Long lastModified;
	public boolean archived;
	
	@PreUpdate
	@PrePersist
	public void setLastModified() {
		lastModified = System.currentTimeMillis();
	}
}

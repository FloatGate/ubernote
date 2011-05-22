package models;

import java.util.TimeZone;

import javax.annotation.Generated;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;

import play.data.validation.Required;
import play.db.jpa.Model;

@Entity
public class Note extends Model {
	public String name;
	public String contents;
	public Long lastModified;
	
	@PreUpdate
	@PrePersist
	public void setLastModified() {
		lastModified = System.currentTimeMillis();
	}
}

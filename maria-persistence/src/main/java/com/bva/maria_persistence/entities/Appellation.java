package com.bva.maria_persistence.entities;

import com.bva.vinocarto_core.model.AppellationDto;
import com.bva.vinocarto_core.model.Colour;
import jakarta.persistence.*;

@Entity
@Table(name = "APPELLATION")
public class Appellation {

    @Id
    @GeneratedValue(strategy= GenerationType.AUTO)
    @Column(name = "ID")
    private Long id;
    @Column(name = "NAME")
    private String name;
    @ManyToOne
    @JoinColumn(name = "REGION_ID_FK")
    private Region region;
    @Column(name = "COLOUR")
    @Enumerated(EnumType.ORDINAL)
    private Colour colour;

    public Appellation(Long id, String name, Region region, Colour colour) {
        this.id = id;
        this.name = name;
        this.region = region;
        this.colour = colour;
    }

    public Appellation() {

    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Region getRegion() {
        return region;
    }

    public void setRegion(Region region) {
        this.region = region;
    }

    public Colour getColour() {
        return colour;
    }

    public void setColour(Colour colour) {
        this.colour = colour;
    }

    @Override
    public String toString() {
        final StringBuilder sb = new StringBuilder("Appellation{");
        sb.append("id=").append(id);
        sb.append(", name='").append(name).append('\'');
        sb.append(", region=").append(region);
        sb.append(", colour=").append(colour);
        sb.append('}');
        return sb.toString();
    }

    public AppellationDto toDto() {
        return new AppellationDto(
              this.getId(),
              this.getName(),
              this.getRegion().getName(),
              this.getColour().name()
        );
    }

    public static Appellation fromDto(AppellationDto dto) {
        Region region = new Region();
        Colour colour = Colour.valueOf(dto.getColour().toUpperCase());
        return new Appellation(dto.getId(), dto.getName(), region, colour);
    }
}
